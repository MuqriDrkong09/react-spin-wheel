import { COLOR_MODE_MESSAGES } from '@/constants/colorMode';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';
import { COLOR_MODE } from '@/types/colorMode';

describe('ColorModeMenu', () => {
  beforeEach(() => {
    resetAppStore();
  });

  it('lets the header switch Light, Dark, and System modes', async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose }));
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.dark }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);

    await user.click(screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose }));
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.light }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.light);

    await user.click(screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose }));
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.system }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.system);
  });
});
