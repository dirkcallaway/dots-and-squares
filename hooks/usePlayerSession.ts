"use client";

import { useEffect, useState } from "react";
import { Id } from "../convex/_generated/dataModel";

export type PlayerNum = "player1" | "player2";

export interface PlayerSession {
  gameId: Id<"games">;
  playerNum: PlayerNum;
}

const sessionKey = (code: string) => `game_session_${code.toUpperCase()}`;

export function savePlayerSession(code: string, session: PlayerSession) {
  if (typeof window === "undefined") return;
  localStorage.setItem(sessionKey(code), JSON.stringify(session));
}

export function loadPlayerSession(code: string): PlayerSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(sessionKey(code));
    if (!raw) return null;
    return JSON.parse(raw) as PlayerSession;
  } catch {
    return null;
  }
}

export function clearPlayerSession(code: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(sessionKey(code));
}

export function usePlayerSession(code: string): PlayerSession | null {
  const [session, setSession] = useState<PlayerSession | null>(null);

  useEffect(() => {
    setSession(loadPlayerSession(code));
  }, [code]);

  return session;
}
