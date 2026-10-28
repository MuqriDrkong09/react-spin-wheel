import { DEFAULT_APP_SETTINGS } from '@/constants/settings';

import { resetSettingsStore, useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  beforeEach(() => {
    resetSettingsStore();
  });

  it('starts with sound enabled and clamps volume updates', () => {
    expect(useSettingsStore.getState().settings).toEqual(DEFAULT_APP_SETTINGS);

    useSettingsStore.getState().updateSettings({ masterVolume: 4, spinSound: false });

    expect(useSettingsStore.getState().settings.masterVolume).toBe(1);
    expect(useSettingsStore.getState().settings.spinSound).toBe(false);
  });
});
