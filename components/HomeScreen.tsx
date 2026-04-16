"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { savePlayerSession } from "@/hooks/usePlayerSession";
import { DEFAULT_GRID_SIZE, GRID_SIZES, type GridSize } from "@/lib/constants";

type Screen = "home" | "new-game" | "join-game";

export function HomeScreen() {
  const [screen, setScreen] = useState<Screen>("home");

  return (
    <main className="flex flex-col items-center justify-center min-h-full px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <div className="text-6xl mb-3">🟦</div>
          <h1 className="text-4xl font-bold text-zinc-800 dark:text-zinc-100 tracking-tight">
            Dots & Boxes
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mt-2 text-lg">A classic game for two</p>
        </div>

        {screen === "home" && <HomeButtons onNew={() => setScreen("new-game")} onJoin={() => setScreen("join-game")} />}
        {screen === "new-game" && <NewGameForm onBack={() => setScreen("home")} />}
        {screen === "join-game" && <JoinGameForm onBack={() => setScreen("home")} />}
      </div>
    </main>
  );
}

function HomeButtons({ onNew, onJoin }: { onNew: () => void; onJoin: () => void }) {
  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={onNew}
        className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xl font-semibold active:scale-95 transition-transform"
      >
        New Game
      </button>
      <button
        onClick={onJoin}
        className="w-full py-4 rounded-2xl border-2 border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-200 text-xl font-semibold active:scale-95 transition-transform"
      >
        Join Game
      </button>
    </div>
  );
}

function NewGameForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const createGame = useMutation(api.games.createGame);

  const [gridSize, setGridSize] = useState<GridSize>(DEFAULT_GRID_SIZE);
  const [deviceMode, setDeviceMode] = useState<"single" | "multi">("single");
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const { gameId, code } = await createGame({ gridSize, deviceMode });
      savePlayerSession(code, { gameId, playerNum: "player1" });
      router.push(`/game/${code}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-3">Grid size</p>
        <div className="flex gap-3">
          {GRID_SIZES.map((size) => (
            <button
              key={size}
              onClick={() => setGridSize(size)}
              className={`flex-1 py-3 rounded-xl text-lg font-semibold border-2 transition-colors ${
                gridSize === size
                  ? "border-zinc-800 bg-zinc-800 text-white dark:border-zinc-200 dark:bg-zinc-200 dark:text-zinc-900"
                  : "border-zinc-300 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
              }`}
            >
              {size + 1}×{size + 1}
              <span className="block text-xs font-normal opacity-70">
                {size * size} squares
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-3">How will you play?</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={() => setDeviceMode("single")}
            className={`w-full py-3 px-4 rounded-xl text-left border-2 transition-colors ${
              deviceMode === "single"
                ? "border-zinc-800 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">📱 This device</span>
            <span className="block text-sm text-zinc-500 dark:text-zinc-400">Pass the tablet back and forth</span>
          </button>
          <button
            onClick={() => setDeviceMode("multi")}
            className={`w-full py-3 px-4 rounded-xl text-left border-2 transition-colors ${
              deviceMode === "multi"
                ? "border-zinc-800 dark:border-zinc-300 bg-zinc-50 dark:bg-zinc-800"
                : "border-zinc-200 dark:border-zinc-700"
            }`}
          >
            <span className="font-semibold text-zinc-800 dark:text-zinc-100">🔗 Two devices</span>
            <span className="block text-sm text-zinc-500 dark:text-zinc-400">Share a code with the other player</span>
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleCreate}
          disabled={loading}
          className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xl font-semibold disabled:opacity-50 active:scale-95 transition-transform"
        >
          {loading ? "Creating…" : "Start Game"}
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 text-zinc-500 dark:text-zinc-400 text-lg"
        >
          Back
        </button>
      </div>
    </div>
  );
}

function JoinGameForm({ onBack }: { onBack: () => void }) {
  const router = useRouter();
  const joinGame = useMutation(api.games.joinGame);

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleJoin() {
    const cleaned = code.trim().toUpperCase();
    if (cleaned.length !== 6) {
      setError("Enter the 6-character game code");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await joinGame({ code: cleaned });
      if ("error" in result && result.error) {
        setError(result.error);
        return;
      }
      if ("gameId" in result && result.gameId) {
        savePlayerSession(cleaned, { gameId: result.gameId, playerNum: "player2" });
        router.push(`/game/${cleaned}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-zinc-600 dark:text-zinc-300 font-medium mb-3">Enter game code</p>
        <input
          type="text"
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase().slice(0, 6));
            setError(null);
          }}
          onKeyDown={(e) => e.key === "Enter" && handleJoin()}
          placeholder="ABC123"
          maxLength={6}
          className="w-full py-4 px-4 rounded-xl border-2 border-zinc-300 dark:border-zinc-600 bg-transparent dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 text-3xl font-bold tracking-widest text-center uppercase focus:outline-none focus:border-zinc-600 dark:focus:border-zinc-400"
          autoCapitalize="characters"
          autoCorrect="off"
          spellCheck={false}
        />
        {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <button
          onClick={handleJoin}
          disabled={loading || code.length !== 6}
          className="w-full py-4 rounded-2xl bg-zinc-800 dark:bg-zinc-100 text-white dark:text-zinc-900 text-xl font-semibold disabled:opacity-40 active:scale-95 transition-transform"
        >
          {loading ? "Joining…" : "Join Game"}
        </button>
        <button
          onClick={onBack}
          className="w-full py-3 text-zinc-500 dark:text-zinc-400 text-lg"
        >
          Back
        </button>
      </div>
    </div>
  );
}
