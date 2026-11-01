import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { ROUTES } from '@/constants/routes';
import { SHARE_MESSAGES, WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import { encodeJsonToBase64Url } from '@/features/wheel-share/utils/base64Url';
import { buildEncodedSharePath } from '@/features/wheel-share/utils/shareUrl';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { renderApp, screen, userEvent } from '@/test/test-utils';

function validShareToken(
  expiresAt = '2026-12-01T00:00:00.000Z',
  createdAt = '2026-11-01T00:00:00.000Z',
) {
  return encodeJsonToBase64Url({
    format: WHEEL_SHARE_FORMAT,
    version: WHEEL_SHARE_VERSION,
    createdAt,
    expiresAt,
    wheel: {
      name: 'Food Picker',
      description: 'Dinner ideas',
      category: 'Food',
      items: [
        {
          name: 'Pizza',
          icon: '🍕',
          color: '#ea580c',
          enabled: true,
          weight: 1,
          children: [{ name: 'Pepperoni', color: '#dc2626', enabled: true, weight: 2 }],
        },
      ],
      settings: DEFAULT_WHEEL_SETTINGS,
    },
  });
}

describe('SharedWheelScreen', () => {
  beforeEach(() => {
    resetWheelStore();
  });

  it('previews a valid shared wheel and saves a copy with new ids', async () => {
    const user = userEvent.setup();
    useWheelStore.getState().createWheel({
      id: 'existing',
      name: 'Food Picker',
      items: [{ name: 'Salad', color: '#16a34a', enabled: true, weight: 1 }],
    });
    renderApp({ initialEntries: [buildEncodedSharePath(validShareToken())] });

    expect(screen.getByRole('heading', { name: SHARE_MESSAGES.pageTitle, level: 1 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Food Picker', level: 2 })).toBeInTheDocument();
    expect(screen.getByText('Dinner ideas')).toBeInTheDocument();
    expect(screen.getByText('🍕 Pizza')).toBeInTheDocument();
    expect(screen.getByText('Pepperoni')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: SHARE_MESSAGES.saveCopy }));

    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
    const copied = useWheelStore.getState().wheels.find((wheel) => wheel.name === 'Food Picker (copy)');
    expect(copied).toBeDefined();
    expect(copied?.id).not.toBe('existing');
    expect(copied?.items[0]?.name).toBe('Pizza');
    expect(copied?.items[0]?.children?.[0]?.name).toBe('Pepperoni');
    expect(screen.getByRole('heading', { name: 'Food Picker (copy)', level: 3 })).toBeInTheDocument();
  });

  it('copies the current share link from the preview', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    const path = buildEncodedSharePath(validShareToken());
    renderApp({ initialEntries: [path] });

    await user.click(screen.getByRole('button', { name: SHARE_MESSAGES.copyLink }));

    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(path));
    expect(await screen.findByRole('alert')).toHaveTextContent(SHARE_MESSAGES.copied('Food Picker'));
    vi.unstubAllGlobals();
  });

  it('shows an invalid state for malformed share data', () => {
    renderApp({ initialEntries: ['/share?s=not-valid'] });
    expect(screen.getByRole('heading', { name: SHARE_MESSAGES.invalidTitle, level: 2 })).toBeInTheDocument();
  });

  it('shows an expired state for expired share data', () => {
    renderApp({
      initialEntries: [
        buildEncodedSharePath(validShareToken('2020-02-01T00:00:00.000Z', '2020-01-01T00:00:00.000Z')),
      ],
    });
    expect(screen.getByRole('heading', { name: SHARE_MESSAGES.expiredTitle, level: 2 })).toBeInTheDocument();
  });

  it('shows a missing state when the share token is absent', () => {
    renderApp({ initialEntries: [ROUTES.sharedWheel] });
    expect(screen.getByRole('heading', { name: SHARE_MESSAGES.missingTitle, level: 2 })).toBeInTheDocument();
  });

  it('shows an unavailable state for remote share ids until a backend is wired', async () => {
    const user = userEvent.setup();
    renderApp({ initialEntries: [`${ROUTES.sharedWheel}/remote-1`] });
    expect(screen.getByRole('heading', { name: SHARE_MESSAGES.unavailableTitle, level: 2 })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: SHARE_MESSAGES.backToDashboard }));
    expect(screen.getByRole('heading', { name: 'Dashboard', level: 1 })).toBeInTheDocument();
  });
});
