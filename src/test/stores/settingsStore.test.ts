import { DEFAULT_APP_SETTINGS } from '@/constants/settings';
import { DEFAULT_MASTER_VOLUME } from '@/constants/sound';

import { resetSettingsStore, useSettingsStore } from '@/stores/settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  it('starts with the default app settings', () => {
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_APP_SETTINGS);
  });

  it('clamps volume updates and keeps other sound toggles', () => {
    useSettingsStore.getState().updateSettings({ masterVolume: 4, spinSound: false });

    expect(useSettingsStore.getState().settings.masterVolume).toBe(1);
    expect(useSettingsStore.getState().settings.spinSound).toBe(false);
    expect(useSettingsStore.getState().settings.tickSound).toBe(true);
  });

  it('keeps the current volume when a patch omits masterVolume', () => {
    useSettingsStore.getState().updateSettings({ masterVolume: 0.2 });
    useSettingsStore.getState().updateSettings({ winnerSound: false, confettiEnabled: false });

    expect(useSettingsStore.getState().settings).toMatchObject({
      masterVolume: 0.2,
      winnerSound: false,
      confettiEnabled: false,
      soundEnabled: true,
    });
  });

  it('clamps a non-finite volume back to the default', () => {
    useSettingsStore.getState().updateSettings({ masterVolume: Number.NaN });

    expect(useSettingsStore.getState().settings.masterVolume).toBe(DEFAULT_MASTER_VOLUME);
  });

  it('resets to the default settings', () => {
    useSettingsStore.getState().updateSettings({
      soundEnabled: false,
      masterVolume: 0.1,
      confirmBeforeDelete: false,
    });

    resetSettingsStore();

    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_APP_SETTINGS);
  });
});
