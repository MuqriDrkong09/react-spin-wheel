import { createConfettiPieces } from '@/features/celebration/utils/createConfettiPieces';

describe('createConfettiPieces', () => {
  it('builds a stable set of pieces from a seed', () => {
    const colors = ['#4f46e5', '#db2777'];
    const first = createConfettiPieces(4, colors, 11);
    const second = createConfettiPieces(4, colors, 11);

    expect(first).toEqual(second);
    expect(first).toHaveLength(4);
    expect(first[0]?.color).toBe('#4f46e5');
    expect(first[1]?.color).toBe('#db2777');
    expect(first.every((piece) => piece.width > 0 && piece.height > 0)).toBe(true);
  });
});
