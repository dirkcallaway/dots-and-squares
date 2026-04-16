"use client";

import { useState } from "react";
import { Doc } from "@/convex/_generated/dataModel";

interface Props {
  game: Doc<"games">;
  playerNum: "player1" | "player2" | null;
}

export function WaitingRoom({ game }: Props) {
  const [copied, setCopied] = useState(false);

  const gameUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/game/${game.code}`
      : `/game/${game.code}`;

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: select the text
    }
  }

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(game.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-4 animate-pulse">⏳</div>
        <h2 className="text-2xl font-bold text-zinc-800 mb-2">Waiting for Player 2</h2>
        <p className="text-zinc-500 mb-8">Share this code or link to invite them</p>

        {/* Big code display */}
        <div className="bg-white border-2 border-zinc-200 rounded-2xl py-6 px-4 mb-4">
          <p className="text-sm text-zinc-400 font-medium uppercase tracking-wide mb-2">Game Code</p>
          <p className="text-5xl font-bold tracking-widest text-zinc-800 font-mono">
            {game.code}
          </p>
        </div>

        {/* Share buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={copyCode}
            className="flex-1 py-3 rounded-xl border-2 border-zinc-300 text-zinc-700 font-semibold active:scale-95 transition-transform"
          >
            {copied ? "Copied!" : "Copy Code"}
          </button>
          <button
            onClick={copyLink}
            className="flex-1 py-3 rounded-xl bg-zinc-800 text-white font-semibold active:scale-95 transition-transform"
          >
            Copy Link
          </button>
        </div>

        <p className="text-sm text-zinc-400">
          {game.deviceMode === "single"
            ? "Or hand the device to Player 2 and have them tap Join Game on the home screen."
            : "Player 2 can join at dots-and-boxes.app or enter the code on the home screen."}
        </p>

        <a href="/" className="block mt-8 text-zinc-400 text-sm">
          ← Back to home
        </a>
      </div>
    </main>
  );
}
