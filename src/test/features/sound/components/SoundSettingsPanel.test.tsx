import { fireEvent } from '@testing-library/react';
import type { ComponentProps } from 'react';

import { SOUND_MESSAGES, SOUND_VOLUME_MAX } from '@/constants/sound';
import { SoundContext } from '@/features/sound/soundContext';
import { SoundSettingsPanel } from '@/features/sound/components/SoundSettingsPanel';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { renderWithProviders, screen, userEvent } from '@/test/test-utils';

const sliderHarness = vi.hoisted(() => ({
  emitValue: null as number[] | null,
}));

vi.mock('@mui/material', async (importOriginal) => {
  const { createElement } = await import('react');
  const actual = await importOriginal<typeof import('@mui/material')>();

  return {
    ...actual,
    Slider: (props: ComponentProps<typeof actual.Slider>) => {
      if (!sliderHarness.emitValue) {
        return createElement(actual.Slider, props);
      }

      return createElement(
        'button',
        {
          type: 'button',
          onClick: () => {
            props.onChange?.({} as never, sliderHarness.emitValue ?? [], 0);
          },
        },
        'emit-slider',
      );
    },
  };
});

function createSound() {
  return {
    play: vi.fn(() => false),
    unlock: vi.fn(async () => true),
    preview: vi.fn(),
  };
}

function renderPanel() {
  const sound = createSound();
  renderWithProviders(
    <SoundContext.Provider value={sound}>
      <SoundSettingsPanel />
    </SoundContext.Provider>,
  );
  return sound;
}

describe('SoundSettingsPanel', () => {
  beforeEach(() => {
    sliderHarness.emitValue = null;
    resetSettingsStore();
  });

  it('renders sound copy and enabled controls', () => {
    renderPanel();

    expect(screen.getByRole('heading', { name: SOUND_MESSAGES.title, level: 2 })).toBeInTheDocument();
    expect(screen.getByText(SOUND_MESSAGES.description)).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled })).toBeChecked();
    expect(screen.getByRole('slider', { name: SOUND_MESSAGES.masterVolume })).toHaveValue('70');
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound })).toBeChecked();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.tickSound })).toBeChecked();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.winnerSound })).toBeChecked();
    expect(screen.getByRole('button', { name: SOUND_MESSAGES.preview })).toBeEnabled();
  });

  it('unlocks and toggles master sound', async () => {
    const user = userEvent.setup();
    const sound = renderPanel();

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled }));

    expect(sound.unlock).toHaveBeenCalledTimes(1);
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(false);
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound })).toBeDisabled();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.tickSound })).toBeDisabled();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.winnerSound })).toBeDisabled();
    expect(screen.getByRole('slider', { name: SOUND_MESSAGES.masterVolume })).toBeDisabled();
    expect(screen.getByRole('button', { name: SOUND_MESSAGES.preview })).toBeDisabled();
  });

  it('toggles spin, tick, and winner channels', async () => {
    const user = userEvent.setup();
    renderPanel();

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound }));
    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.tickSound }));
    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.winnerSound }));

    expect(useSettingsStore.getState().settings).toMatchObject({
      spinSound: false,
      tickSound: false,
      winnerSound: false,
    });
  });

  it('updates master volume from the slider', () => {
    renderPanel();

    fireEvent.change(screen.getByRole('slider', { name: SOUND_MESSAGES.masterVolume }), {
      target: { value: '40' },
    });

    expect(useSettingsStore.getState().settings.masterVolume).toBe((40 / 100) * SOUND_VOLUME_MAX);
  });

  it('uses the first thumb when the slider reports a range', async () => {
    const user = userEvent.setup();
    sliderHarness.emitValue = [25];
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'emit-slider' }));

    expect(useSettingsStore.getState().settings.masterVolume).toBe(0.25);
  });

  it('treats an empty range as zero volume', async () => {
    const user = userEvent.setup();
    sliderHarness.emitValue = [];
    renderPanel();

    await user.click(screen.getByRole('button', { name: 'emit-slider' }));

    expect(useSettingsStore.getState().settings.masterVolume).toBe(0);
  });

  it('unlocks and previews sounds', async () => {
    const user = userEvent.setup();
    const sound = renderPanel();

    await user.click(screen.getByRole('button', { name: SOUND_MESSAGES.preview }));

    expect(sound.unlock).toHaveBeenCalledTimes(1);
    expect(sound.preview).toHaveBeenCalledTimes(1);
  });
});
