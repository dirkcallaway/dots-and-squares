/**
 * Pure game logic — no React, no Convex imports.
 * Imported by both client components and Convex server functions.
 *
 * Grid terminology:
 *   gridSize (N) = number of squares per side
 *   Dots: (N+1) × (N+1) grid
 *   Horizontal edges: (N+1) rows × N cols  → N*(N+1) total
 *   Vertical edges:   N rows × (N+1) cols  → N*(N+1) total
 *   Squares: N × N grid
 */

export type PlayerNum = "player1" | "player2";
export type EdgeType = "horizontal" | "vertical";

// ── Edge indexing ──────────────────────────────────────────────────────────────

/** Horizontal edge at dot-row `row`, gap-col `col` → flat index */
export function hEdgeIndex(gridSize: number, row: number, col: number): number {
  return row * gridSize + col;
}

/** Vertical edge at gap-row `row`, dot-col `col` → flat index */
export function vEdgeIndex(gridSize: number, row: number, col: number): number {
  return row * (gridSize + 1) + col;
}

/** Square at `row`, `col` → flat index */
export function squareIndex(gridSize: number, row: number, col: number): number {
  return row * gridSize + col;
}

/** Total number of horizontal (or vertical) edges for a given gridSize */
export function edgeCount(gridSize: number): number {
  return gridSize * (gridSize + 1);
}

/** Total number of squares for a given gridSize */
export function squareCount(gridSize: number): number {
  return gridSize * gridSize;
}

// ── Square completion ──────────────────────────────────────────────────────────

/**
 * Returns true if the square at (row, col) has all 4 edges placed.
 */
export function isSquareComplete(
  gridSize: number,
  hEdges: boolean[],
  vEdges: boolean[],
  row: number,
  col: number
): boolean {
  const top    = hEdgeIndex(gridSize, row,     col);
  const bottom = hEdgeIndex(gridSize, row + 1, col);
  const left   = vEdgeIndex(gridSize, row,     col);
  const right  = vEdgeIndex(gridSize, row,     col + 1);
  return hEdges[top] && hEdges[bottom] && vEdges[left] && vEdges[right];
}

/**
 * After placing an edge, returns the indices of any newly completed squares.
 * Checks only the 1–2 squares adjacent to the placed edge.
 */
export function getNewlyCompletedSquares(
  gridSize: number,
  hEdges: boolean[],
  vEdges: boolean[],
  edgeType: EdgeType,
  edgeRow: number,
  edgeCol: number
): number[] {
  const completed: number[] = [];

  if (edgeType === "horizontal") {
    // Square above: (edgeRow-1, edgeCol)
    if (edgeRow > 0 && isSquareComplete(gridSize, hEdges, vEdges, edgeRow - 1, edgeCol)) {
      completed.push(squareIndex(gridSize, edgeRow - 1, edgeCol));
    }
    // Square below: (edgeRow, edgeCol)
    if (edgeRow < gridSize && isSquareComplete(gridSize, hEdges, vEdges, edgeRow, edgeCol)) {
      completed.push(squareIndex(gridSize, edgeRow, edgeCol));
    }
  } else {
    // Square to left: (edgeRow, edgeCol-1)
    if (edgeCol > 0 && isSquareComplete(gridSize, hEdges, vEdges, edgeRow, edgeCol - 1)) {
      completed.push(squareIndex(gridSize, edgeRow, edgeCol - 1));
    }
    // Square to right: (edgeRow, edgeCol)
    if (edgeCol < gridSize && isSquareComplete(gridSize, hEdges, vEdges, edgeRow, edgeCol)) {
      completed.push(squareIndex(gridSize, edgeRow, edgeCol));
    }
  }

  return completed;
}

// ── Adjacency ──────────────────────────────────────────────────────────────────

export type DotCoord = { row: number; col: number };

/**
 * Returns the edge between two adjacent dots, or null if not adjacent.
 * Dots are adjacent if they differ by exactly 1 in either row or col (not both).
 */
export function edgeBetweenDots(
  gridSize: number,
  a: DotCoord,
  b: DotCoord
): { type: EdgeType; row: number; col: number } | null {
  const dr = b.row - a.row;
  const dc = b.col - a.col;

  if (dr === 0 && Math.abs(dc) === 1) {
    // Horizontal edge — same row, adjacent cols
    const col = Math.min(a.col, b.col);
    return { type: "horizontal", row: a.row, col };
  }

  if (dc === 0 && Math.abs(dr) === 1) {
    // Vertical edge — adjacent rows, same col
    const row = Math.min(a.row, b.row);
    return { type: "vertical", row, col: a.col };
  }

  return null;
}

/**
 * Returns all dot coords adjacent to the given dot within the grid.
 */
export function adjacentDots(gridSize: number, dot: DotCoord): DotCoord[] {
  const dots: DotCoord[] = [];
  const n = gridSize + 1; // dots per side
  if (dot.row > 0)     dots.push({ row: dot.row - 1, col: dot.col });
  if (dot.row < n - 1) dots.push({ row: dot.row + 1, col: dot.col });
  if (dot.col > 0)     dots.push({ row: dot.row, col: dot.col - 1 });
  if (dot.col < n - 1) dots.push({ row: dot.row, col: dot.col + 1 });
  return dots;
}

/**
 * Returns true if the edge between two adjacent dots is already placed.
 */
export function isEdgePlaced(
  gridSize: number,
  hEdges: boolean[],
  vEdges: boolean[],
  a: DotCoord,
  b: DotCoord
): boolean {
  const edge = edgeBetweenDots(gridSize, a, b);
  if (!edge) return false;
  if (edge.type === "horizontal") {
    return hEdges[hEdgeIndex(gridSize, edge.row, edge.col)];
  } else {
    return vEdges[vEdgeIndex(gridSize, edge.row, edge.col)];
  }
}

// ── Game over ──────────────────────────────────────────────────────────────────

/**
 * Returns true when all squares are claimed.
 */
export function isGameOver(squares: (PlayerNum | null)[]): boolean {
  return squares.every((s) => s !== null);
}

/**
 * Returns the winner, "tie", or null if game is still in progress.
 */
export function getWinner(
  squares: (PlayerNum | null)[]
): PlayerNum | "tie" | null {
  if (!isGameOver(squares)) return null;
  let p1 = 0, p2 = 0;
  for (const s of squares) {
    if (s === "player1") p1++;
    else if (s === "player2") p2++;
  }
  if (p1 > p2) return "player1";
  if (p2 > p1) return "player2";
  return "tie";
}

// ── Initial state helpers ──────────────────────────────────────────────────────

export function emptyEdges(gridSize: number): boolean[] {
  return Array(edgeCount(gridSize)).fill(false);
}

export function emptySquares(gridSize: number): (PlayerNum | null)[] {
  return Array(squareCount(gridSize)).fill(null);
}
