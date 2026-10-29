import { createConfettiPieces } from '@/features/celebration/utils/createConfettiPieces';

const COLORS = ['#4f46e5', '#db2777', '#16a34a'] as const;

describe('createConfettiPieces', () => {
  it('builds a stable set of pieces from a seed', () => {
    const first = createConfettiPieces(4, COLORS, 11);
    const second = createConfettiPieces(4, COLORS, 11);

    expect(first).toEqual(second);
    expect(first).toHaveLength(4);
    expect(first.map((piece) => piece.id)).toEqual([0, 1, 2, 3]);
    expect(first[0]?.color).toBe('#4f46e5');
    expect(first[1]?.color).toBe('#db2777');
    expect(first[2]?.color).toBe('#16a34a');
    expect(first[3]?.color).toBe('#4f46e5');
  });

  it('uses a default seed that stays deterministic', () => {
    expect(createConfettiPieces(3, COLORS)).toEqual(createConfettiPieces(3, COLORS, 7));
  });

  it('changes the layout when the seed changes', () => {
    expect(createConfettiPieces(4, COLORS, 11)).not.toEqual(createConfettiPieces(4, COLORS, 12));
  });

  it('falls back to indigo when the palette is empty', () => {
    const pieces = createConfettiPieces(2, []);

    expect(pieces).toHaveLength(2);
    expect(pieces.every((piece) => piece.color === '#4f46e5')).toBe(true);
  });

  it('returns no pieces when the count is zero', () => {
    expect(createConfettiPieces(0, COLORS)).toEqual([]);
  });

  it('keeps piece geometry within the expected ranges', () => {
    const pieces = createConfettiPieces(36, COLORS, 7);

    expect(pieces.every((piece) => piece.left.endsWith('%'))).toBe(true);
    expect(pieces.every((piece) => piece.delay >= 0 && piece.delay <= 0.35)).toBe(true);
    expect(pieces.every((piece) => piece.duration >= 1.15 && piece.duration <= 2.05)).toBe(true);
    expect(pieces.every((piece) => piece.drift >= -70 && piece.drift <= 70)).toBe(true);
    expect(pieces.every((piece) => piece.rotate >= -270 && piece.rotate <= 270)).toBe(true);
    expect(pieces.every((piece) => piece.width >= 6 && piece.width <= 12)).toBe(true);
    expect(pieces.every((piece) => piece.height >= 10 && piece.height <= 18)).toBe(true);
  });
});
