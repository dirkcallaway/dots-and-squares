import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import {
  emptyEdges,
  emptySquares,
  hEdgeIndex,
  vEdgeIndex,
  getNewlyCompletedSquares,
  getWinner,
  type PlayerNum,
} from "../lib/gameLogic";
import { EXPIRY_MS } from "../lib/constants";

// ── Helpers ────────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

// ── Queries ────────────────────────────────────────────────────────────────────

export const getGameByCode = query({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    return await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();
  },
});

// ── Mutations ──────────────────────────────────────────────────────────────────

export const createGame = mutation({
  args: {
    gridSize: v.number(),
    deviceMode: v.union(v.literal("single"), v.literal("multi")),
  },
  handler: async (ctx, { gridSize, deviceMode }) => {
    // Generate a unique code
    let code = generateCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await ctx.db
        .query("games")
        .withIndex("by_code", (q) => q.eq("code", code))
        .first();
      if (!existing) break;
      code = generateCode();
      attempts++;
    }

    const now = Date.now();
    const gameId = await ctx.db.insert("games", {
      code,
      gridSize,
      status: deviceMode === "single" ? "setup" : "waiting",
      currentTurn: "player1",
      horizontalEdges: emptyEdges(gridSize),
      verticalEdges: emptyEdges(gridSize),
      squares: emptySquares(gridSize),
      deviceMode,
      createdAt: now,
      expiresAt: now + EXPIRY_MS,
    });

    return { gameId, code };
  },
});

export const joinGame = mutation({
  args: { code: v.string() },
  handler: async (ctx, { code }) => {
    const game = await ctx.db
      .query("games")
      .withIndex("by_code", (q) => q.eq("code", code.toUpperCase()))
      .first();

    if (!game) return { error: "Game not found" };
    if (game.status !== "waiting") return { error: "Game already started" };
    if (Date.now() > game.expiresAt) return { error: "Game has expired" };

    await ctx.db.patch(game._id, { status: "setup" });
    return { gameId: game._id, code: game.code };
  },
});

export const setPlayerIdentity = mutation({
  args: {
    gameId: v.id("games"),
    playerNum: v.union(v.literal("player1"), v.literal("player2")),
    color: v.string(),
    emoji: v.string(),
  },
  handler: async (ctx, { gameId, playerNum, color, emoji }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return { error: "Game not found" };
    if (game.status !== "setup" && game.status !== "waiting") {
      return { error: "Game is not in setup phase" };
    }

    const playerData = { color, emoji, score: 0, ready: true };
    const patch: Record<string, unknown> = { [playerNum]: playerData };

    // Check if both players are ready to start
    const otherPlayer = playerNum === "player1" ? game.player2 : game.player1;
    if (otherPlayer?.ready) {
      patch.status = "active";
    } else if (game.status === "waiting" && playerNum === "player1") {
      // Single-device: P1 sets up, game moves to setup for P2
      patch.status = "setup";
    }

    await ctx.db.patch(gameId, patch);
    return { success: true };
  },
});

export const placeLine = mutation({
  args: {
    gameId: v.id("games"),
    playerNum: v.union(v.literal("player1"), v.literal("player2")),
    edgeType: v.union(v.literal("horizontal"), v.literal("vertical")),
    edgeRow: v.number(),
    edgeCol: v.number(),
  },
  handler: async (ctx, { gameId, playerNum, edgeType, edgeRow, edgeCol }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return { error: "Game not found" };
    if (game.status !== "active") return { error: "Game is not active" };
    if (game.currentTurn !== playerNum) return { error: "Not your turn" };

    const { gridSize } = game;
    const hEdges = [...game.horizontalEdges];
    const vEdges = [...game.verticalEdges];

    // Validate edge coords
    if (edgeType === "horizontal") {
      if (edgeRow < 0 || edgeRow > gridSize || edgeCol < 0 || edgeCol >= gridSize) {
        return { error: "Invalid edge coordinates" };
      }
      const idx = hEdgeIndex(gridSize, edgeRow, edgeCol);
      if (hEdges[idx]) return { error: "Edge already placed" };
      hEdges[idx] = playerNum;
    } else {
      if (edgeRow < 0 || edgeRow >= gridSize || edgeCol < 0 || edgeCol > gridSize) {
        return { error: "Invalid edge coordinates" };
      }
      const idx = vEdgeIndex(gridSize, edgeRow, edgeCol);
      if (vEdges[idx]) return { error: "Edge already placed" };
      vEdges[idx] = playerNum;
    }

    // Check for newly completed squares
    const newSquares = getNewlyCompletedSquares(
      gridSize, hEdges, vEdges, edgeType, edgeRow, edgeCol
    );

    const squares = [...game.squares] as (typeof game.squares);
    let scoreGain = 0;
    for (const sqIdx of newSquares) {
      squares[sqIdx] = playerNum;
      scoreGain++;
    }

    // Update scores
    const player1 = game.player1
      ? { ...game.player1, score: game.player1.score + (playerNum === "player1" ? scoreGain : 0) }
      : undefined;
    const player2 = game.player2
      ? { ...game.player2, score: game.player2.score + (playerNum === "player2" ? scoreGain : 0) }
      : undefined;

    // Turn: if captured squares, same player goes again; otherwise switch
    const nextTurn: "player1" | "player2" =
      scoreGain > 0 ? playerNum : playerNum === "player1" ? "player2" : "player1";

    // Check game over
    const winner = getWinner(squares as (PlayerNum | null)[]);
    const status = winner !== null ? "complete" : "active";

    await ctx.db.patch(gameId, {
      horizontalEdges: hEdges,
      verticalEdges: vEdges,
      squares,
      player1,
      player2,
      currentTurn: nextTurn,
      status,
      lastMove: { edgeType, edgeRow, edgeCol },
      ...(winner !== null ? { winner } : {}),
    });

    return { success: true, squaresCaptured: scoreGain };
  },
});

export const rematch = mutation({
  args: { gameId: v.id("games") },
  handler: async (ctx, { gameId }) => {
    const game = await ctx.db.get(gameId);
    if (!game) return { error: "Game not found" };
    if (game.status !== "complete") return { error: "Game is not complete" };

    const now = Date.now();

    // Reset board, keep players (but zero scores), loser goes first
    const loser =
      game.winner === "player1" ? "player2"
      : game.winner === "player2" ? "player1"
      : "player1"; // tie: player1 goes first

    await ctx.db.patch(gameId, {
      status: "active",
      currentTurn: loser,
      horizontalEdges: emptyEdges(game.gridSize),
      verticalEdges: emptyEdges(game.gridSize),
      squares: emptySquares(game.gridSize),
      player1: game.player1 ? { ...game.player1, score: 0 } : undefined,
      player2: game.player2 ? { ...game.player2, score: 0 } : undefined,
      winner: undefined,
      lastMove: undefined,
      expiresAt: now + EXPIRY_MS,
    });

    return { success: true };
  },
});

export const cleanupExpiredGames = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const expired = await ctx.db
      .query("games")
      .withIndex("by_expiry", (q) => q.lt("expiresAt", now))
      .collect();

    for (const game of expired) {
      await ctx.db.delete(game._id);
    }

    return { deleted: expired.length };
  },
});
