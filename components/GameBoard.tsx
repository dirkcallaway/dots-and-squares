"use client";

import { useState, useRef, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/constants";
import {
  hEdgeIndex,
  vEdgeIndex,
  edgeBetweenDots,
  isEdgePlaced,
  adjacentDots,
  type DotCoord,
} from "@/lib/gameLogic";

interface Props {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}

// Layout constants
const DOT_RADIUS = 8;
const DOT_HIT_RADIUS = 28;
const CELL_SIZE = 72; // px per cell
const PADDING = 36;

function boardSize(gridSize: number) {
  return gridSize * CELL_SIZE + PADDING * 2;
}

function dotX(col: number) {
  return PADDING + col * CELL_SIZE;
}

function dotY(row: number) {
  return PADDING + row * CELL_SIZE;
}

// Resolve a hex color from a player's color id
function playerHex(colorId: string | undefined): string {
  return COLORS.find((c) => c.id === colorId)?.hex ?? "#888";
}

export function GameBoard({ game, playerNum }: Props) {
  const placeLine = useMutation(api.games.placeLine);
  const [selected, setSelected] = useState<DotCoord | null>(null);
  const [placing, setPlacing] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);

  const { gridSize, horizontalEdges: hEdges, verticalEdges: vEdges, squares, currentTurn } = game;
  const isMyTurn = playerNum !== null && currentTurn === playerNum;
  const dots = gridSize + 1; // dots per side
  const svgSize = boardSize(gridSize);

  const p1Color = playerHex(game.player1?.color);
  const p2Color = playerHex(game.player2?.color);


  const handleDotTap = useCallback(
    async (dot: DotCoord) => {
      if (!isMyTurn || placing) return;

      if (!selected) {
        setSelected(dot);
        return;
      }

      // Tapping the same dot → deselect
      if (selected.row === dot.row && selected.col === dot.col) {
        setSelected(null);
        return;
      }

      const edge = edgeBetweenDots(gridSize, selected, dot);

      // Not adjacent → move selection to new dot
      if (!edge) {
        setSelected(dot);
        return;
      }

      // Already placed → ignore
      if (isEdgePlaced(gridSize, hEdges, vEdges, selected, dot)) {
        setSelected(null);
        return;
      }

      // Place the line
      setSelected(null);
      setPlacing(true);
      try {
        await placeLine({
          gameId: game._id,
          playerNum: playerNum!,
          edgeType: edge.type,
          edgeRow: edge.row,
          edgeCol: edge.col,
        });
      } finally {
        setPlacing(false);
      }
    },
    [isMyTurn, placing, selected, gridSize, hEdges, vEdges, game._id, playerNum, placeLine]
  );

  // Derive valid adjacent dots to selected (for highlighting)
  const validAdjacentDots: DotCoord[] = selected
    ? adjacentDots(gridSize, selected).filter(
        (adj) => !isEdgePlaced(gridSize, hEdges, vEdges, selected, adj)
      )
    : [];

  return (
    <div className="flex flex-col items-center justify-center min-h-full gap-4 px-2 py-4">
      <ScoreBar game={game} playerNum={playerNum} />

      <TurnBanner game={game} playerNum={playerNum} />

      {/* Board */}
      <div className="relative">
        <svg
          ref={svgRef}
          width={svgSize}
          height={svgSize}
          viewBox={`0 0 ${svgSize} ${svgSize}`}
          className="touch-none select-none"
          style={{ maxWidth: "min(90vw, 90vh - 160px)" }}
        >
          {/* Claimed squares */}
          {squares.map((owner, idx) => {
            if (!owner) return null;
            const row = Math.floor(idx / gridSize);
            const col = idx % gridSize;
            const x = dotX(col);
            const y = dotY(row);
            const color = owner === "player1" ? p1Color : p2Color;
            const emoji = owner === "player1" ? game.player1?.emoji : game.player2?.emoji;
            return (
              <g key={`sq-${idx}`}>
                <rect
                  x={x}
                  y={y}
                  width={CELL_SIZE}
                  height={CELL_SIZE}
                  fill={color}
                  fillOpacity={0.18}
                />
                <text
                  x={x + CELL_SIZE / 2}
                  y={y + CELL_SIZE / 2}
                  textAnchor="middle"
                  dominantBaseline="central"
                  fontSize={CELL_SIZE * 0.42}
                >
                  {emoji}
                </text>
              </g>
            );
          })}

          {/* Horizontal edges */}
          {Array.from({ length: dots }, (_, row) =>
            Array.from({ length: gridSize }, (_, col) => {
              const idx = hEdgeIndex(gridSize, row, col);
              const placed = hEdges[idx];
              const x1 = dotX(col);
              const x2 = dotX(col + 1);
              const y = dotY(row);
              return (
                <line
                  key={`h-${row}-${col}`}
                  x1={x1}
                  y1={y}
                  x2={x2}
                  y2={y}
                  style={{ stroke: placed ? "var(--svg-edge-placed)" : "var(--svg-edge-unplaced)" }}
                  strokeWidth={placed ? 6 : 3}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Vertical edges */}
          {Array.from({ length: gridSize }, (_, row) =>
            Array.from({ length: dots }, (_, col) => {
              const idx = vEdgeIndex(gridSize, row, col);
              const placed = vEdges[idx];
              const x = dotX(col);
              const y1 = dotY(row);
              const y2 = dotY(row + 1);
              return (
                <line
                  key={`v-${row}-${col}`}
                  x1={x}
                  y1={y1}
                  x2={x}
                  y2={y2}
                  style={{ stroke: placed ? "var(--svg-edge-placed)" : "var(--svg-edge-unplaced)" }}
                  strokeWidth={placed ? 6 : 3}
                  strokeLinecap="round"
                />
              );
            })
          )}

          {/* Valid adjacent highlights (when a dot is selected) */}
          {validAdjacentDots.map((adj) => (
            <circle
              key={`adj-${adj.row}-${adj.col}`}
              cx={dotX(adj.col)}
              cy={dotY(adj.row)}
              r={DOT_RADIUS + 6}
              fill="none"
              style={{ stroke: "var(--svg-square-dashes)" }}
              strokeWidth={2}
              strokeDasharray="4 3"
            />
          ))}

          {/* Dots */}
          {Array.from({ length: dots }, (_, row) =>
            Array.from({ length: dots }, (_, col) => {
              const isSelected =
                selected?.row === row && selected?.col === col;
              const cx = dotX(col);
              const cy = dotY(row);
              return (
                <g key={`dot-${row}-${col}`} onClick={() => handleDotTap({ row, col })}>
                  {/* Large invisible hit area */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={DOT_HIT_RADIUS}
                    fill="transparent"
                    className={isMyTurn && !placing ? "cursor-pointer" : ""}
                  />
                  {/* Selected ring */}
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={DOT_RADIUS + 8}
                      fill="none"
                      style={{ stroke: "var(--svg-dot)" }}
                      strokeWidth={3}
                      className="animate-pulse"
                    />
                  )}
                  {/* Visible dot */}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={DOT_RADIUS}
                    style={{ fill: "var(--svg-dot)" }}
                    className="pointer-events-none"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
}

// ── Score bar ──────────────────────────────────────────────────────────────────

function ScoreBar({
  game,
  playerNum,
}: {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}) {
  const { player1, player2 } = game;
  const p1Color = playerHex(player1?.color);
  const p2Color = playerHex(player2?.color);

  return (
    <div className="flex items-center gap-6">
      <PlayerScore
        player={player1}
        color={p1Color}
        label={playerNum === "player1" ? "You" : "Player 1"}
        isCurrent={game.currentTurn === "player1"}
      />
      <div className="text-zinc-400 dark:text-zinc-500 text-xl font-bold">vs</div>
      <PlayerScore
        player={player2}
        color={p2Color}
        label={playerNum === "player2" ? "You" : "Player 2"}
        isCurrent={game.currentTurn === "player2"}
      />
    </div>
  );
}

function PlayerScore({
  player,
  color,
  label,
  isCurrent,
}: {
  player: { emoji: string; score: number } | undefined;
  color: string;
  label: string;
  isCurrent: boolean;
}) {
  return (
    <div
      className={`flex flex-col items-center gap-1 px-5 py-3 rounded-2xl transition-colors ${
        isCurrent
          ? "bg-zinc-800 dark:bg-zinc-200"
          : "bg-zinc-100 dark:bg-zinc-800"
      }`}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-xl shadow-sm"
        style={{ backgroundColor: color }}
      >
        {player?.emoji ?? "?"}
      </div>
      <span className={`text-xs font-medium ${isCurrent ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
        {label}
      </span>
      <span className={`text-2xl font-bold ${isCurrent ? "text-white dark:text-zinc-900" : "text-zinc-800 dark:text-zinc-100"}`}>
        {player?.score ?? 0}
      </span>
    </div>
  );
}

// ── Turn banner ────────────────────────────────────────────────────────────────

function TurnBanner({
  game,
  playerNum,
}: {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}) {
  const isMyTurn = playerNum !== null && game.currentTurn === playerNum;
  const currentPlayer =
    game.currentTurn === "player1" ? game.player1 : game.player2;

  if (!currentPlayer) return null;

  return (
    <div
      className={`px-5 py-2 rounded-full text-sm font-semibold ${
        isMyTurn
          ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900"
          : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
      }`}
    >
      {isMyTurn
        ? "Your turn — tap a dot"
        : `${currentPlayer.emoji} Player's turn…`}
    </div>
  );
}
