import { WinnerCelebration } from '@/features/celebration/components/WinnerCelebration';
import { SoundContext } from '@/features/sound/soundContext';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { renderWithProviders, screen } from '@/test/test-utils';
import { SOUND_ID } from '@/types/sound';

function renderCelebration(
  play: ReturnType<typeof vi.fn>,
  props: Partial<Parameters<typeof WinnerCelebration>[0]> = {},
) {
  return renderWithProviders(
    <SoundContext.Provider
      value={{
        play,
        unlock: async () => false,
        preview: () => undefined,
      }}
    >
      <WinnerCelebration {...props}>
        <div>Winner card</div>
      </WinnerCelebration>
    </SoundContext.Provider>,
  );
}

describe('WinnerCelebration', () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  it('shows confetti and plays the celebration sound', () => {
    const play = vi.fn();
    renderCelebration(play);

    expect(screen.getByTestId('celebration-confetti')).toBeInTheDocument();
    expect(screen.getByText('Winner card')).toBeInTheDocument();
    expect(play).toHaveBeenCalledWith(SOUND_ID.celebration);
  });

  it('skips confetti when reduced motion is requested', () => {
    const play = vi.fn();
    renderCelebration(play, { reducedMotion: true });

    expect(screen.queryByTestId('celebration-confetti')).not.toBeInTheDocument();
    expect(play).toHaveBeenCalledWith(SOUND_ID.celebration);
  });

  it('skips confetti when celebration effects are disabled', () => {
    useSettingsStore.getState().updateSettings({ confettiEnabled: false });
    const play = vi.fn();
    renderCelebration(play);

    expect(screen.queryByTestId('celebration-confetti')).not.toBeInTheDocument();
    expect(play).toHaveBeenCalledWith(SOUND_ID.celebration);
  });

  it('skips confetti when the wheel disables celebration', () => {
    const play = vi.fn();
    renderCelebration(play, { enabled: false });

    expect(screen.queryByTestId('celebration-confetti')).not.toBeInTheDocument();
    expect(play).toHaveBeenCalledWith(SOUND_ID.celebration);
  });

  it('does not play sound when sound is disabled', () => {
    const play = vi.fn();
    renderCelebration(play, { soundEnabled: false });

    expect(screen.getByTestId('celebration-confetti')).toBeInTheDocument();
    expect(play).not.toHaveBeenCalled();
  });
});
