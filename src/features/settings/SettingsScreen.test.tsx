import { SOUND_MESSAGES } from '@/constants/sound';
import { CELEBRATION_MESSAGES } from '@/features/celebration/constants';
import { SETTINGS_MESSAGES } from '@/features/settings/constants';
import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';

describe('SettingsScreen', () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  it('lets the user disable sound and individual channels', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/settings'] });

    expect(screen.getByRole('heading', { name: SETTINGS_MESSAGES.title })).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.tickSound }));
    expect(useSettingsStore.getState().settings.tickSound).toBe(false);

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled }));
    expect(useSettingsStore.getState().settings.soundEnabled).toBe(false);
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound })).toBeDisabled();
    expect(screen.getByRole('button', { name: SOUND_MESSAGES.preview })).toBeDisabled();
  });

  it('lets the user disable celebration effects', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: ['/settings'] });

    expect(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled }));
    expect(useSettingsStore.getState().settings.confettiEnabled).toBe(false);
    expect(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled })).not.toBeChecked();
  });
});
