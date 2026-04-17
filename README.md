# Dots & Boxes

A mobile-first, two-player [Dots and Boxes](https://en.wikipedia.org/wiki/Dots_and_boxes) game built for tablet play. Supports both passing a single device between players and real-time two-device play over the internet.

## Features

- **Two play modes** — pass one tablet back and forth, or play on separate devices in real-time
- **Live sync** — moves appear instantly on both screens via Convex's reactive backend
- **Player identity** — each player picks a color and emoji (no accounts required)
- **Colored lines** — each player's drawn lines appear in their chosen color
- **Replay button** — flash the last move so you never lose track of what changed
- **Rematch** — reset the board in-place without leaving the page
- **Dark mode** — follows system preference with a manual toggle
- **Game codes** — share a 6-character code or a direct link to invite Player 2
- **Auto-expiry** — games are automatically cleaned up after 24 hours

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Backend / DB | [Convex](https://convex.dev) |
| Deployment | Vercel (frontend) + Convex Cloud (backend) |

## Local Development

**Prerequisites:** Node.js 18+, a [Convex](https://convex.dev) account.

```bash
# Install dependencies
npm install

# Start the Convex dev server (first run will prompt you to log in and create a project)
npx convex dev

# In a second terminal, start the Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`npx convex dev` watches `convex/` and hot-reloads schema and functions automatically. Keep it running alongside the Next.js server.

## Environment Variables

Convex injects `NEXT_PUBLIC_CONVEX_URL` automatically during `npx convex dev`. For production, add it to your Vercel project:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_CONVEX_URL` | Convex dashboard → your project → Settings |

## Deployment

**Frontend (Vercel)**

Connect the GitHub repo to a Vercel project. Set `NEXT_PUBLIC_CONVEX_URL` in the Vercel environment variables. Pushes to `main` deploy automatically.

**Backend (Convex)**

```bash
npx convex deploy
```

Run this after any changes to `convex/schema.ts` or `convex/games.ts`. The frontend deploy does not automatically update Convex.

> **Note:** If you change the schema in a way that is incompatible with existing documents (e.g. changing a field's type), you may need to clear the `games` table in the Convex dashboard before deploying.

## Project Structure

```
app/                  Next.js App Router pages and layout
components/           React components (GameBoard, GameSetup, WaitingRoom, etc.)
convex/               Convex schema, mutations, queries, and scheduled jobs
hooks/                usePlayerSession — localStorage-based player identity
lib/
  gameLogic.ts        Pure game logic (edge indexing, square detection, win condition)
  constants.ts        Colors, emojis, grid sizes, expiry duration
```

## How the Game Works

The board is an N×N grid of squares (default 4×4) with dots at each corner. Players take turns connecting two adjacent dots. Completing the fourth side of a square claims it and earns another turn. The player with the most squares when the board is full wins.

**Edge storage:** Horizontal and vertical edges are stored as flat arrays of `"player1" | "player2" | null`. Indices follow the formulas in `lib/gameLogic.ts` and are shared between the client and Convex server functions.
