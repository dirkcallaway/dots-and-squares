export const COLORS = [
  { id: "red",    hex: "#EF4444", label: "Red"    },
  { id: "blue",   hex: "#3B82F6", label: "Blue"   },
  { id: "green",  hex: "#22C55E", label: "Green"  },
  { id: "purple", hex: "#A855F7", label: "Purple" },
  { id: "orange", hex: "#F97316", label: "Orange" },
  { id: "pink",   hex: "#EC4899", label: "Pink"   },
] as const;

export type ColorId = (typeof COLORS)[number]["id"];

export const EMOJIS = ["🦊", "🐶", "🐸", "🦁", "🐙", "🦋", "🐼", "🦄", "🐢", "🦀", "🐬", "🌟"] as const;

export type Emoji = (typeof EMOJIS)[number];

// gridSize = number of squares per side
// 4 → 4×4 squares, 5×5 dots (default)
// 5 → 5×5 squares, 6×6 dots
export const GRID_SIZES = [4, 5] as const;
export type GridSize = (typeof GRID_SIZES)[number];
export const DEFAULT_GRID_SIZE: GridSize = 4;

export const EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours
