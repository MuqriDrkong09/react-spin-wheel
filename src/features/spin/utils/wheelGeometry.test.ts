import { FULL_TURN, POINTER_ANGLE, buildWheelGeometry } from '@/features/spin/utils/wheelGeometry';
import type { WheelItem } from '@/types/wheel';

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
});
