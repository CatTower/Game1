export interface Position {
  col: number;
  row: number;
}

// Grid structure: 5 columns. [5, 4, 5, 4, 5] cells.
export const GRID_COLS = 5;
export const getRowLimit = (col: number): number => (col % 2 === 0 ? 5 : 4);

// Convert col, row coordinates to pixel coordinates for SVG rendering
export const CELL_HEIGHT = 220;
export const CELL_WIDTH = 198;
export const VERTICAL_OFFSET = 110;

export interface PixelCoords {
  x: number;
  y: number;
}

export function getCellCenter(col: number, row: number): PixelCoords {
  const x = 144 + col * CELL_WIDTH;
  const y = 110 + row * CELL_HEIGHT + (col % 2 !== 0 ? VERTICAL_OFFSET : 0);
  return { x, y };
}

// Generate the points string for a flat-topped hexagon SVG polygon
export function getHexagonPoints(cx: number, cy: number, radius: number): string {
  const points: string[] = [];
  for (let i = 0; i < 6; i++) {
    // Flat-topped corners are at 0, 60, 120, 180, 240, 300 degrees
    const angleRad = (Math.PI / 180) * (i * 60);
    const x = cx + radius * Math.cos(angleRad);
    const y = cy + radius * Math.sin(angleRad);
    points.push(`${x},${y}`);
  }
  return points.join(' ');
}

// Hex adjacency check (flat-topped column-offset coordinate system)
export function isAdjacent(pos1: Position, pos2: Position): boolean {
  if (pos1.col === pos2.col && pos1.row === pos2.row) return false;

  const dc = pos2.col - pos1.col;
  const dr = pos2.row - pos1.row;

  // Must be in neighboring columns/rows [-1, 1]
  if (Math.abs(dc) > 1 || Math.abs(dr) > 1) return false;

  // Offset-specific rules
  if (pos1.col % 2 === 0) {
    // Even column: cannot connect to row + 1 in adjacent columns
    if (dc !== 0 && dr === 1) return false;
  } else {
    // Odd column: cannot connect to row - 1 in adjacent columns
    if (dc !== 0 && dr === -1) return false;
  }

  return true;
}

// Calculate connection angle (yaw) in degrees between current and prev position
export function getConnectionAngle(current: Position, prev: Position): number {
  const dc = current.col - prev.col;
  const dr = current.row - prev.row;

  if (dc === 0) {
    return dr <= 0 ? 0 : 180;
  }

  if ((current.col % 2 === 0 && dr !== 0) || (current.col % 2 === 1 && dr === 0)) {
    return dc <= 0 ? 240 : 120;
  }

  return dc <= 0 ? 300 : 60;
}

// Get all adjacent valid positions for a given coordinate
export function getNeighbors(pos: Position): Position[] {
  const neighbors: Position[] = [];
  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      const neighbor: Position = { col: pos.col + dc, row: pos.row + dr };
      // Check boundaries
      if (neighbor.col >= 0 && neighbor.col < GRID_COLS) {
        const rowLimit = getRowLimit(neighbor.col);
        if (neighbor.row >= 0 && neighbor.row < rowLimit) {
          if (isAdjacent(pos, neighbor)) {
            neighbors.push(neighbor);
          }
        }
      }
    }
  }
  return neighbors;
}

// Generate path for the word on the grid using backtracking DFS
export function generateWordPath(word: string): Position[] | null {
  const wordLength = word.length;
  const used = new Set<string>();

  // Helper to format key
  const toKey = (pos: Position) => `${pos.col},${pos.row}`;

  // Get all active grid positions
  const allPositions: Position[] = [];
  for (let c = 0; c < GRID_COLS; c++) {
    const limit = getRowLimit(c);
    for (let r = 0; r < limit; r++) {
      allPositions.push({ col: c, row: r });
    }
  }

  // Backtracking DFS search
  function search(index: number, currentPos: Position, path: Position[]): Position[] | null {
    if (index === wordLength) return path;

    const neighbors = getNeighbors(currentPos);
    // Shuffle neighbors to get random path variations
    const shuffled = [...neighbors].sort(() => Math.random() - 0.5);

    for (const neighbor of shuffled) {
      const key = toKey(neighbor);
      if (!used.has(key)) {
        used.add(key);
        const result = search(index + 1, neighbor, [...path, neighbor]);
        if (result) return result;
        used.delete(key);
      }
    }

    return null;
  }

  // Try starting from random tiles (shuffle starting candidates)
  const startCandidates = [...allPositions].sort(() => Math.random() - 0.5);
  for (const startPos of startCandidates) {
    used.clear();
    used.add(toKey(startPos));
    const path = search(1, startPos, [startPos]);
    if (path) return path;
  }

  return null;
}
