import { DEFAULT_WHEEL_APPEARANCE } from '@/constants/wheelAppearance';
import { WheelPreview } from '@/features/wheel-customization/components/WheelPreview';
import { renderWithProviders } from '@/test/test-utils';
import { CENTER_BUTTON_STYLE, type WheelAppearance, type WheelItem } from '@/types/wheel';

function item(name: string, extra?: Partial<WheelItem>): WheelItem {
  return {
    id: name.toLowerCase(),
    name,
    color: '#ea580c',
    enabled: true,
    weight: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...extra,
  };
}

function appearance(overrides: Partial<WheelAppearance> = {}): WheelAppearance {
  return { ...DEFAULT_WHEEL_APPEARANCE, ...overrides };
}

function previewParts(
  items: WheelItem[],
  overrides: Partial<WheelAppearance> = {},
) {
  const { container } = renderWithProviders(
    <WheelPreview items={items} appearance={appearance(overrides)} />,
  );
  const root = container.querySelector('[aria-hidden="true"]');
  const [disc, pointer, hub] = [...(root?.children ?? [])] as HTMLElement[];

  return { disc, pointer, hub };
}

describe('WheelPreview', () => {
  it('uses a solid background when there are no active items', () => {
    const { disc } = previewParts([item('Pizza', { enabled: false }), item('Burger', { weight: 0 })]);

    expect(window.getComputedStyle(disc).backgroundImage).toBe('none');
    expect(window.getComputedStyle(disc).backgroundColor).toBe('rgb(248, 250, 252)');
  });

  it('paints a conic gradient from palette colors and a filled hub', () => {
    const { disc, pointer, hub } = previewParts(
      [item('Pizza', { color: '#ea580c' }), item('Burger', { color: '#ca8a04' })],
      {
        segmentColors: ['#111111', '#22c55e'],
        pointerColor: '#f43f5e',
        centerButtonStyle: CENTER_BUTTON_STYLE.filled,
        centerButtonColor: '#082f49',
        borderWidth: 3,
        borderColor: '#22d3ee',
      },
    );

    expect(window.getComputedStyle(disc).backgroundImage).toContain('conic-gradient');
    expect(window.getComputedStyle(disc).backgroundImage).toContain('rgb(17, 17, 17)');
    expect(window.getComputedStyle(disc).borderTopWidth).toBe('3px');
    expect(window.getComputedStyle(pointer).borderTopColor).toBe('rgb(244, 63, 94)');
    expect(window.getComputedStyle(hub).backgroundColor).toBe('rgb(8, 47, 73)');
    expect(window.getComputedStyle(hub).borderTopStyle).toBe('none');
  });

  it('outlines the hub and uses the wheel background for unfilled styles', () => {
    const outlined = previewParts([item('Pizza')], {
      centerButtonStyle: CENTER_BUTTON_STYLE.outlined,
      centerButtonColor: '#4f46e5',
      background: '#fff7ed',
    });

    expect(window.getComputedStyle(outlined.hub).backgroundColor).toBe('rgb(255, 247, 237)');
    expect(window.getComputedStyle(outlined.hub).borderTop).toContain('rgb(79, 70, 229)');

    const ghost = previewParts([item('Pizza')], {
      centerButtonStyle: CENTER_BUTTON_STYLE.ghost,
      background: '#020617',
      centerButtonColor: '#22d3ee',
    });

    expect(window.getComputedStyle(ghost.hub).backgroundColor).toBe('rgb(2, 6, 23)');
    expect(window.getComputedStyle(ghost.hub).borderTopStyle).toBe('none');
  });

  it('falls back to item colors when the palette is empty', () => {
    const { disc } = previewParts(
      [item('Pizza', { color: '#ea580c' }), item('Burger', { color: '#0f766e' })],
      { segmentColors: [] },
    );

    expect(window.getComputedStyle(disc).backgroundImage).toContain('conic-gradient');
    expect(window.getComputedStyle(disc).backgroundImage).toContain('rgb(234, 88, 12)');
    expect(window.getComputedStyle(disc).backgroundImage).toContain('rgb(15, 118, 110)');
  });
});
