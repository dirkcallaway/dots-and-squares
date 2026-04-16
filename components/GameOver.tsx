"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { COLORS } from "@/lib/constants";

interface Props {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}

export function GameOver({ game, playerNum }: Props) {
  const rematch = useMutation(api.games.rematch);

  const { player1, player2, winner } = game;

  const winnerPlayer = winner === "player1" ? player1 : winner === "player2" ? player2 : null;
  const winnerColor = winnerPlayer
    ? COLORS.find((c) => c.id === winnerPlayer.color)?.hex ?? "#888"
    : "#888";

  const p1Score = player1?.score ?? 0;
  const p2Score = player2?.score ?? 0;
  const isYourWin =
    (playerNum === "player1" && winner === "player1") ||
    (playerNum === "player2" && winner === "player2");

  async function handleRematch() {
    await rematch({ gameId: game._id });
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
      <div className="w-full max-w-sm">
        {winner === "tie" ? (
          <>
            <div className="text-6xl mb-4">🤝</div>
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">It&apos;s a Tie!</h2>
          </>
        ) : (
          <>
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-4 shadow-lg"
              style={{ backgroundColor: winnerColor }}
            >
              {winnerPlayer?.emoji}
            </div>
            <h2 className="text-3xl font-bold text-zinc-800 dark:text-zinc-100 mb-2">
              {isYourWin ? "You win! 🎉" : playerNum ? "You lose 😔" : `${winnerPlayer?.emoji} wins!`}
            </h2>
          </>
        )}

        <div className="flex gap-4 justify-center mt-6 mb-8">
          <ScoreCard
            player={player1}
            label="Player 1"
            score={p1Score}
            isWinner={winner === "player1"}
          />
          <div className="flex items-center text-zinc-400 dark:text-zinc-500 text-xl font-bold">vs</div>
          <ScoreCard
            player={player2}
            label="Player 2"
            score={p2Score}
            isWinner={winner === "player2"}
          />
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleRematch}
            className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xl font-semibold active:scale-95 transition-transform"
          >
            Rematch
          </button>
          <a href="/" className="block w-full py-3 text-zinc-500 dark:text-zinc-400 text-lg">
            Back to Home
          </a>
        </div>
      </div>
    </main>
  );
}

function ScoreCard({
  player,
  label,
  score,
  isWinner,
}: {
  player: { color: string; emoji: string } | undefined;
  label: string;
  score: number;
  isWinner: boolean;
}) {
  const color = COLORS.find((c) => c.id === player?.color)?.hex ?? "#ccc";
  return (
    <div
      className={`flex flex-col items-center gap-2 px-6 py-4 rounded-2xl border-2 ${
        isWinner
          ? "border-zinc-800 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800"
          : "border-zinc-200 dark:border-zinc-700"
      }`}
    >
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-sm"
        style={{ backgroundColor: color }}
      >
        {player?.emoji ?? "?"}
      </div>
      <p className="text-zinc-500 dark:text-zinc-400 text-xs">{label}</p>
      <p className="text-3xl font-bold text-zinc-800 dark:text-zinc-100">{score}</p>
    </div>
  );
}
