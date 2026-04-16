"use client";

import { Doc } from "@/convex/_generated/dataModel";

interface Props {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}

// Full implementation coming next
export function GameBoard({ game, playerNum }: Props) {
  return (
    <div className="flex items-center justify-center min-h-full text-zinc-400 text-lg">
      Game board — {game.gridSize}×{game.gridSize} — {playerNum ?? "spectator"}
    </div>
  );
}
