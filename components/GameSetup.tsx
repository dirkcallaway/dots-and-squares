"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Doc } from "@/convex/_generated/dataModel";
import { COLORS, EMOJIS } from "@/lib/constants";

interface Props {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}

export function GameSetup({ game, playerNum }: Props) {
  const activeSetupPlayer = resolveSetupPlayer(game, playerNum);

  if (!activeSetupPlayer) {
    return (
      <div className="flex items-center justify-center min-h-full text-zinc-400 dark:text-zinc-500 text-lg">
        Waiting for other player to set up…
      </div>
    );
  }

  return (
    <SetupForm
      game={game}
      playerNum={activeSetupPlayer}
      isPlayer1={activeSetupPlayer === "player1"}
    />
  );
}

function resolveSetupPlayer(
  game: Doc<"games">,
  sessionPlayer: "player1" | "player2" | null
): "player1" | "player2" | null {
  if (game.deviceMode === "multi") {
    if (!sessionPlayer) return null;
    const player = sessionPlayer === "player1" ? game.player1 : game.player2;
    if (player?.ready) return null;
    return sessionPlayer;
  }
  if (!game.player1?.ready) return "player1";
  if (!game.player2?.ready) return "player2";
  return null;
}

interface SetupFormProps {
  game: Doc<"games">;
  playerNum: "player1" | "player2";
  isPlayer1: boolean;
}

function SetupForm({ game, playerNum, isPlayer1 }: SetupFormProps) {
  const setIdentity = useMutation(api.games.setPlayerIdentity);

  const [color, setColor] = useState<string>(COLORS[isPlayer1 ? 0 : 1].id);
  const [emoji, setEmoji] = useState<string>(EMOJIS[isPlayer1 ? 0 : 1]);
  const [loading, setLoading] = useState(false);
  const [handoff, setHandoff] = useState(false);

  const otherPlayerColor =
    playerNum === "player1" ? game.player2?.color : game.player1?.color;

  async function handleReady() {
    setLoading(true);
    try {
      await setIdentity({ gameId: game._id, playerNum, color, emoji });
      if (game.deviceMode === "single" && playerNum === "player1") {
        setHandoff(true);
      }
    } finally {
      setLoading(false);
    }
  }

  if (handoff) {
    return (
      <main className="flex flex-col items-center justify-center min-h-full px-6 py-12 text-center">
        <div className="text-6xl mb-6">🤝</div>
        <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-3">Hand the tablet to Player 2</h2>
        <p className="text-zinc-500 dark:text-zinc-400">Player 2 needs to pick their color and emoji.</p>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-full px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
            {isPlayer1 ? "Player 1" : "Player 2"} — Choose your look
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-1">Pick a color and an emoji</p>
        </div>

        {/* Preview */}
        <div
          className="w-24 h-24 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 shadow-md"
          style={{ backgroundColor: COLORS.find((c) => c.id === color)?.hex ?? "#888" }}
        >
          {emoji}
        </div>

        {/* Color picker */}
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-3">Color</p>
        <div className="flex gap-3 mb-6 flex-wrap">
          {COLORS.map((c) => {
            const isOther = c.id === otherPlayerColor;
            const isSelected = c.id === color;
            return (
              <button
                key={c.id}
                onClick={() => !isOther && setColor(c.id)}
                disabled={isOther}
                title={isOther ? "Taken by other player" : c.label}
                className={`w-12 h-12 rounded-full transition-transform ${
                  isSelected ? "scale-125 ring-4 ring-zinc-400 dark:ring-zinc-500 ring-offset-2 dark:ring-offset-zinc-900" : ""
                } ${isOther ? "opacity-30 cursor-not-allowed" : "active:scale-110"}`}
                style={{ backgroundColor: c.hex }}
              />
            );
          })}
        </div>

        {/* Emoji picker */}
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-3">Emoji</p>
        <div className="grid grid-cols-6 gap-2 mb-8">
          {EMOJIS.map((e) => (
            <button
              key={e}
              onClick={() => setEmoji(e)}
              className={`text-3xl h-12 w-12 rounded-xl flex items-center justify-center transition-transform active:scale-90 ${
                emoji === e
                  ? "bg-zinc-200 dark:bg-zinc-600 scale-110"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-700"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        <button
          onClick={handleReady}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? "Saving…" : "Ready!"}
        </button>
      </div>
    </main>
  );
}
