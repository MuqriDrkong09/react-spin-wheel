export interface ConfettiPiece {
  id: number;
  left: string;
  delay: number;
  duration: number;
  drift: number;
  rotate: number;
  width: number;
  height: number;
  color: string;
}

export function createConfettiPieces(
  count: number,
  colors: readonly string[],
  seed = 7,
): ConfettiPiece[] {
  let state = seed;
  function random() {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  }

  return Array.from({ length: count }, (_, id) => {
    const color = colors[id % colors.length] ?? '#4f46e5';
    return {
      id,
      left: `${random() * 100}%`,
      delay: random() * 0.35,
      duration: 1.15 + random() * 0.9,
      drift: (random() - 0.5) * 140,
      rotate: (random() - 0.5) * 540,
      width: 6 + random() * 6,
      height: 10 + random() * 8,
      color,
    };
  });
}
