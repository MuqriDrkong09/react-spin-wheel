import { FULL_TURN, POINTER_ANGLE, buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import type { HexColor, WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#4f46e5',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

describe('buildWheelGeometry', () => {
  it('builds no segments for an empty list', () => {
    const geometry = buildWheelGeometry([]);

    expect(geometry.segments).toEqual([]);
    expect(geometry.pointer.points.split(' ')).toHaveLength(3);
  });

  it('excludes disabled items from active segments', () => {
    const geometry = buildWheelGeometry([
      item('Pizza', { color: '#ea580c' }),
      item('Burger', { enabled: false, weight: 8, color: '#ca8a04' }),
      item('Sushi', { color: '#0f766e' }),
    ]);

    expect(geometry.segments.map((segment) => segment.name)).toEqual(['Pizza', 'Sushi']);
    expect(geometry.segments[0]?.sweepAngle).toBeCloseTo(FULL_TURN / 2);
    expect(geometry.segments[1]?.sweepAngle).toBeCloseTo(FULL_TURN / 2);
  });

  it('excludes zero-weight and invalid-weight items', () => {
    const geometry = buildWheelGeometry([
      item('Pizza'),
      item('Salad', { weight: 0 }),
      item('Broken', { weight: Number.NaN }),
      item('Sushi'),
    ]);

    expect(geometry.segments.map((segment) => segment.id)).toEqual(['pizza', 'sushi']);
  });

  it('uses a full-circle donut path for a single item', () => {
    const geometry = buildWheelGeometry([item('Pizza', { icon: '🍕', color: '#ea580c' })]);
    const [segment] = geometry.segments;

    expect(geometry.segments).toHaveLength(1);
    expect(segment?.isFullCircle).toBe(true);
    expect(segment?.sweepAngle).toBeCloseTo(FULL_TURN);
    expect(segment?.path.startsWith('M ')).toBe(true);
    expect(segment?.path).toContain('A ');
    expect(segment?.labelText).toBe('🍕 Pizza');
    expect(segment?.labelLines).toEqual([{ text: '🍕 Pizza', y: 0 }]);
    expect(segment?.labelOrientation).toBe('tangent');
    expect(segment?.showLabel).toBe(true);
  });

  it('sizes segments in proportion to weight', () => {
    const geometry = buildWheelGeometry([
      item('Pizza', { weight: 1 }),
      item('Burger', { weight: 2 }),
      item('Sushi', { weight: 1 }),
    ]);

    expect(geometry.segments[0]?.sweepAngle).toBeCloseTo(FULL_TURN / 4);
    expect(geometry.segments[1]?.sweepAngle).toBeCloseTo(FULL_TURN / 2);
    expect(geometry.segments[2]?.sweepAngle).toBeCloseTo(FULL_TURN / 4);
    expect(geometry.segments[0]?.startAngle).toBeCloseTo(POINTER_ANGLE);
    expect(geometry.segments[1]?.labelRotation).toBeCloseTo(0);
    expect(geometry.segments.reduce((sum, segment) => sum + segment.sweepAngle, 0)).toBeCloseTo(
      FULL_TURN,
    );
  });

  it('precomputes label coordinates and contrast color', () => {
    const geometry = buildWheelGeometry([
      item('Pizza', { color: '#ea580c' }),
      item('Light', { color: '#f8fafc' }),
    ]);

    expect(geometry.segments[0]?.labelFill).toBe('#ffffff');
    expect(geometry.segments[1]?.labelFill).toBe('#0f172a');
    expect(Number.isFinite(geometry.segments[0]?.labelX)).toBe(true);
    expect(Number.isFinite(geometry.segments[0]?.labelY)).toBe(true);
    expect(geometry.centerButtonPercent).toBeGreaterThan(0);
    expect(geometry.centerButtonPercent).toBeLessThan(30);
    expect(geometry.hub.r).toBeLessThan(geometry.radius * 0.3);
    expect(geometry.hub.cx).toBe(geometry.size / 2);
  });

  it('wraps or shortens long labels so they stay inside crowded slices', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 11 }, (_, index) =>
        item('Cadillac F1 Team', { id: `team-${index}`, color: '#0ea5e9' }),
      ),
    );
    const [segment] = geometry.segments;

    expect(segment?.labelOrientation).toBe('radial');
    expect(segment?.labelText).toBe('Cadillac F1 Team');
    expect(segment?.labelLines.length).toBeGreaterThan(0);
    expect(segment?.labelLines.length).toBeLessThanOrEqual(2);
    expect(segment?.labelLines.every((line) => line.text.length <= 12)).toBe(true);
    expect(segment?.labelFontSize).toBeLessThanOrEqual(geometry.labelFontSize);
  });

  it('does not treat nested children as extra segments', () => {
    const geometry = buildWheelGeometry([
      item('Pizza', { children: [item('Chicken', { weight: 9 })] }),
      item('Burger'),
    ]);

    expect(geometry.segments.map((segment) => segment.id)).toEqual(['pizza', 'burger']);
  });

  it('applies palette colors, text color, and font size from appearance', () => {
    const geometry = buildWheelGeometry(
      [item('Pizza', { color: '#ea580c' }), item('Burger', { color: '#ca8a04' })],
      200,
      {
        appearance: {
          segmentColors: ['#111111', '#22c55e'],
          textColor: '#f8fafc',
          fontSize: 20,
        },
      },
    );

    expect(geometry.segments[0]?.color).toBe('#111111');
    expect(geometry.segments[1]?.color).toBe('#22c55e');
    expect(geometry.segments[0]?.labelFill).toBe('#f8fafc');
    expect(geometry.labelFontSize).toBeGreaterThan(9);
  });

  it('hides labels on very narrow slices and sanitizes clip ids', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 24 }, (_, index) =>
        item(`Item ${index}`, { id: `item ${index}!`, color: '#0ea5e9' }),
      ),
    );

    expect(geometry.segments).toHaveLength(24);
    expect(geometry.segments.every((segment) => segment.showLabel === false)).toBe(true);
    expect(geometry.segments[0]?.labelLines).toEqual([]);
    expect(geometry.segments[0]?.clipPathId).toBe('spin-wheel-clip-item0');
  });

  it('uses a large arc for a slice bigger than a half turn', () => {
    const geometry = buildWheelGeometry([
      item('Pizza', { weight: 3 }),
      item('Burger', { weight: 1 }),
    ]);
    const [pizza] = geometry.segments;

    expect(pizza?.sweepAngle).toBeGreaterThan(Math.PI);
    expect(pizza?.path).toContain('A ');
    expect(pizza?.path).toMatch(/0 1 1/);
  });

  it('truncates an unbreakable label that cannot fit even at the minimum font', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 12 }, (_, index) =>
        item('Supercalifragilisticexpialidocious', { id: `word-${index}` }),
      ),
    );
    const [segment] = geometry.segments;

    expect(segment?.labelLines.length).toBeGreaterThan(0);
    expect(segment?.labelLines[0]?.text.includes('…') || segment?.labelLines[0]!.text.length < 34).toBe(
      true,
    );
  });

  it('drops labels that cannot fit an ellipsis at a huge font size', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 8 }, (_, index) => item(`Item${index}`, { id: `tiny-${index}` })),
      200,
      { appearance: { segmentColors: [], textColor: undefined as unknown as HexColor, fontSize: 200 } },
    );

    expect(geometry.segments[0]?.showLabel).toBe(false);
    expect(geometry.segments[0]?.labelLines).toEqual([]);
  });

  it('renders a lone ellipsis when no character plus ellipsis will fit', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 8 }, (_, index) =>
        item('Supercalifragilisticexpialidocious', { id: `ellipsis-${index}` }),
      ),
      200,
      { appearance: { segmentColors: [], textColor: undefined as unknown as HexColor, fontSize: 120 } },
    );

    expect(geometry.segments[0]?.labelLines.map((line) => line.text)).toEqual(['…']);
  });

  it('truncates leftover words on the last available line', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 22 }, (_, index) =>
        item('abcdefghijkl mnopqrstuvwx', { id: `pair-${index}` }),
      ),
    );
    const [segment] = geometry.segments;

    expect(segment?.showLabel).toBe(true);
    expect(segment?.labelLines.length).toBe(1);
    expect(segment?.labelLines[0]?.text.length).toBeGreaterThan(0);
  });

  it('gives up leftover tokens after truncating an oversized first word', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 22 }, (_, index) =>
        item('Supercalifragilisticexpialidocious Extra', { id: `overflow-${index}` }),
      ),
    );
    const [segment] = geometry.segments;

    expect(segment?.labelLines.length).toBeLessThanOrEqual(1);
  });

  it('skips blank labels and leftover whitespace tokens', () => {
    const geometry = buildWheelGeometry([
      item('Blank', { name: '' }),
      item('Spaces', { name: '   ' }),
    ]);

    expect(geometry.segments.map((segment) => segment.labelLines)).toEqual([[], []]);
    expect(geometry.segments.every((segment) => segment.showLabel === false)).toBe(true);
  });

  it('wraps leftover words onto a truncated last line', () => {
    const geometry = buildWheelGeometry(
      Array.from({ length: 10 }, (_, index) =>
        item('One Two Three Four Five', { id: `phrase-${index}` }),
      ),
    );
    const [segment] = geometry.segments;

    expect(segment?.labelLines.length).toBeGreaterThan(0);
    expect(segment?.labelLines.length).toBeLessThanOrEqual(2);
  });

  it('parses short, hashless, and invalid segment colors for contrast', () => {
    const geometry = buildWheelGeometry([
      item('Short', { color: '#fff' as HexColor }),
      item('Hashless', { color: '00ff00' as HexColor }),
      item('Invalid', { color: 'not-a-color' as HexColor }),
    ]);

    expect(geometry.segments[0]?.labelFill).toBe('#0f172a');
    expect(geometry.segments[1]?.labelFill).toBe('#0f172a');
    expect(geometry.segments[2]?.labelFill).toBe('#ffffff');
    expect(geometry.segments[2]?.color).toBe('not-a-color');
  });

  it('falls back when a palette color is missing and scales a custom size', () => {
    const geometry = buildWheelGeometry(
      [item('Pizza', { color: '#ea580c' }), item('Burger', { color: '#ca8a04' })],
      400,
      {
        appearance: {
          segmentColors: ['#111111', undefined as unknown as HexColor],
          textColor: '#f8fafc',
          fontSize: 14,
        },
      },
    );

    expect(geometry.size).toBe(400);
    expect(geometry.segments[0]?.color).toBe('#111111');
    expect(geometry.segments[1]?.color).toBe('#ca8a04');
    expect(geometry.radius).toBeGreaterThan(100);
  });
});
