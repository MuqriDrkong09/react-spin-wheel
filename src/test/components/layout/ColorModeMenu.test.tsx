import { ColorModeMenu } from '@/components/layout/ColorModeMenu';
import { COLOR_MODE_MESSAGES } from '@/constants/colorMode';
import { resetAppStore, useAppStore } from '@/stores/appStore';
import { renderWithProviders, screen, userEvent, within } from '@/test/test-utils';
import { COLOR_MODE } from '@/types/colorMode';

function triggerButton() {
  return screen.getByRole('button', { name: COLOR_MODE_MESSAGES.choose });
}

describe('ColorModeMenu', () => {
  beforeEach(() => {
    resetAppStore();
  });

  afterEach(() => {
    resetAppStore();
  });

  it('shows the system icon and a closed menu by default', () => {
    renderWithProviders(<ColorModeMenu />);

    const trigger = triggerButton();

    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
    expect(within(trigger).getByTestId('SettingsBrightnessOutlinedIcon')).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('shows the dark icon when an explicit dark mode is selected', () => {
    useAppStore.getState().setColorMode(COLOR_MODE.dark);
    renderWithProviders(<ColorModeMenu />);

    expect(within(triggerButton()).getByTestId('DarkModeOutlinedIcon')).toBeInTheDocument();
  });

  it('shows the light icon when an explicit light mode is selected', () => {
    useAppStore.getState().setColorMode(COLOR_MODE.light);
    renderWithProviders(<ColorModeMenu />);

    expect(within(triggerButton()).getByTestId('LightModeOutlinedIcon')).toBeInTheDocument();
  });

  it('opens the menu with Light, Dark, and System options and marks the current mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ColorModeMenu />);

    const trigger = triggerButton();
    await user.click(trigger);

    const menu = screen.getByRole('menu', { name: COLOR_MODE_MESSAGES.choose });
    const systemItem = screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.system });

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', 'color-mode-menu');
    expect(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.light })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.dark })).toBeInTheDocument();
    expect(systemItem).toHaveClass('Mui-selected');
    expect(within(systemItem).getByTestId('CheckIcon')).toBeInTheDocument();
    expect(within(menu).getByTestId('LightModeOutlinedIcon')).toBeInTheDocument();
    expect(within(menu).getByTestId('DarkModeOutlinedIcon')).toBeInTheDocument();
    expect(within(menu).getByTestId('SettingsBrightnessOutlinedIcon')).toBeInTheDocument();
  });

  it('lets the header switch Light, Dark, and System modes', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ColorModeMenu />);

    await user.click(triggerButton());
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.dark }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.dark);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(triggerButton()).getByTestId('DarkModeOutlinedIcon')).toBeInTheDocument();

    await user.click(triggerButton());
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.light }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.light);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(triggerButton()).getByTestId('LightModeOutlinedIcon')).toBeInTheDocument();

    await user.click(triggerButton());
    await user.click(screen.getByRole('menuitem', { name: COLOR_MODE_MESSAGES.system }));
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.system);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(within(triggerButton()).getByTestId('SettingsBrightnessOutlinedIcon')).toBeInTheDocument();
  });

  it('closes the menu without changing the mode', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ColorModeMenu />);

    await user.click(triggerButton());
    expect(screen.getByRole('menu', { name: COLOR_MODE_MESSAGES.choose })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(triggerButton()).toHaveAttribute('aria-expanded', 'false');
    expect(useAppStore.getState().colorMode).toBe(COLOR_MODE.system);
  });
});
