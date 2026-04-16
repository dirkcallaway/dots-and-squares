"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { usePlayerSession } from "@/hooks/usePlayerSession";
import { WaitingRoom } from "./WaitingRoom";
import { GameSetup } from "./GameSetup";
import { GameBoard } from "./GameBoard";
import { GameOver } from "./GameOver";

interface Props {
  code: string;
}

export function GamePage({ code }: Props) {
  const game = useQuery(api.games.getGameByCode, { code });
  const session = usePlayerSession(code);

  // Loading
  if (game === undefined) {
    return (
      <div className="flex items-center justify-center min-h-full text-zinc-400 text-lg">
        Loading…
      </div>
    );
  }

  // Not found
  if (game === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-6">
        <p className="text-2xl font-semibold text-zinc-700">Game not found</p>
        <p className="text-zinc-500 text-center">This game may have expired or the code is incorrect.</p>
        <a href="/" className="mt-2 py-3 px-6 rounded-xl bg-zinc-800 text-white font-semibold">
          Back to Home
        </a>
      </div>
    );
  }

  const playerNum = session?.playerNum ?? null;

  if (game.status === "waiting") {
    return <WaitingRoom game={game} playerNum={playerNum} />;
  }

  if (game.status === "setup") {
    return <GameSetup game={game} playerNum={playerNum} />;
  }

  if (game.status === "complete") {
    return <GameOver game={game} playerNum={playerNum} />;
  }

  // active
  return <GameBoard game={game} playerNum={playerNum} />;
}
