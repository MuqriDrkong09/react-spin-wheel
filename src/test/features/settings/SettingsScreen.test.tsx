import { fireEvent } from '@testing-library/react';

import { SOUND_MESSAGES, SOUND_VOLUME_MAX } from '@/constants/sound';
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
    await renderApp({ initialEntries: ['/settings'] });

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
    await renderApp({ initialEntries: ['/settings'] });

    expect(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled })).toBeChecked();

    await user.click(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled }));
    expect(useSettingsStore.getState().settings.confettiEnabled).toBe(false);
    expect(screen.getByRole('switch', { name: CELEBRATION_MESSAGES.enabled })).not.toBeChecked();
  });

  it('updates master volume from the slider', async () => {
    await renderApp({ initialEntries: ['/settings'] });

    fireEvent.change(screen.getByRole('slider', { name: SOUND_MESSAGES.masterVolume }), {
      target: { value: '40' },
    });

    expect(useSettingsStore.getState().settings.masterVolume).toBe((40 / 100) * SOUND_VOLUME_MAX);
    expect(screen.getByRole('slider', { name: SOUND_MESSAGES.masterVolume })).toHaveValue('40');
  });

  it('restores sound channels when sound is turned back on', async () => {
    const user = userEvent.setup();
    await renderApp({ initialEntries: ['/settings'] });

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled }));
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound })).toBeDisabled();

    await user.click(screen.getByRole('switch', { name: SOUND_MESSAGES.enabled }));

    expect(useSettingsStore.getState().settings.soundEnabled).toBe(true);
    expect(screen.getByRole('switch', { name: SOUND_MESSAGES.spinSound })).toBeEnabled();
    expect(screen.getByRole('button', { name: SOUND_MESSAGES.preview })).toBeEnabled();
  });
});
