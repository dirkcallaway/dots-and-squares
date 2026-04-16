"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  loadPlayerSession,
  savePlayerSession,
  type PlayerSession,
} from "@/hooks/usePlayerSession";
import { WaitingRoom } from "./WaitingRoom";
import { GameSetup } from "./GameSetup";
import { GameBoard } from "./GameBoard";
import { GameOver } from "./GameOver";

interface Props {
  code: string;
}

export function GamePage({ code }: Props) {
  const game = useQuery(api.games.getGameByCode, { code });
  const joinGame = useMutation(api.games.joinGame);

  const [session, setSession] = useState<PlayerSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const autoJoinAttempted = useRef(false);

  // Load session from localStorage (client-side only)
  useEffect(() => {
    setSession(loadPlayerSession(code));
    setSessionLoaded(true);
  }, [code]);

  // Auto-join as Player 2 when arriving via shared link
  useEffect(() => {
    if (!sessionLoaded) return;
    if (!game || game.status !== "waiting" || game.deviceMode !== "multi") return;
    if (session) return; // already have a session
    if (autoJoinAttempted.current) return;
    autoJoinAttempted.current = true;

    joinGame({ code }).then((result) => {
      if ("gameId" in result && result.gameId) {
        const newSession: PlayerSession = { gameId: result.gameId, playerNum: "player2" };
        savePlayerSession(code, newSession);
        setSession(newSession);
      }
    });
  }, [sessionLoaded, game, session, code, joinGame]);

  // Loading
  if (game === undefined) {
    return (
      <div className="flex items-center justify-center min-h-full text-zinc-400 dark:text-zinc-500 text-lg">
        Loading…
      </div>
    );
  }

  if (game === null) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full gap-4 px-6">
        <p className="text-2xl font-semibold text-zinc-700 dark:text-zinc-200">Game not found</p>
        <p className="text-zinc-500 dark:text-zinc-400 text-center">This game may have expired or the code is incorrect.</p>
        <a href="/" className="mt-2 py-3 px-6 rounded-xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 font-semibold">
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
