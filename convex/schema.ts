import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const playerV = v.object({
  color: v.string(),
  emoji: v.string(),
  score: v.number(),
  ready: v.boolean(),
});

export default defineSchema({
  games: defineTable({
    code: v.string(),
    gridSize: v.number(),
    status: v.union(
      v.literal("waiting"),  // P1 created, waiting for P2
      v.literal("setup"),    // Both joined, picking color/emoji
      v.literal("active"),   // Game in progress
      v.literal("complete")  // Game over
    ),
    currentTurn: v.union(v.literal("player1"), v.literal("player2")),
    player1: v.optional(playerV),
    player2: v.optional(playerV),
    horizontalEdges: v.array(v.boolean()),
    verticalEdges: v.array(v.boolean()),
    squares: v.array(v.union(v.literal("player1"), v.literal("player2"), v.null())),
    deviceMode: v.union(v.literal("single"), v.literal("multi")),
    createdAt: v.number(),
    expiresAt: v.number(),
    winner: v.optional(
      v.union(v.literal("player1"), v.literal("player2"), v.literal("tie"))
    ),
  })
    .index("by_code", ["code"])
    .index("by_expiry", ["expiresAt"]),
});
