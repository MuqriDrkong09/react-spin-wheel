import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';

import { DEFAULT_WHEEL_SETTINGS } from '@/constants/wheel';
import { ROUTES } from '@/constants/routes';
import { SHARE_MESSAGES, WHEEL_SHARE_FORMAT, WHEEL_SHARE_VERSION } from '@/features/wheel-share/constants';
import { useSharedWheel } from '@/features/wheel-share/hooks/useSharedWheel';
import { encodeJsonToBase64Url } from '@/features/wheel-share/utils/base64Url';
import * as copyTextModule from '@/features/wheel-share/utils/copyText';
import { buildEncodedSharePath } from '@/features/wheel-share/utils/shareUrl';
import { persistStores } from '@/services/storage/storePersistence';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

vi.mock('@/services/storage/storePersistence', () => ({
  persistStores: vi.fn(),
}));

const persistStoresMock = vi.mocked(persistStores);

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
      items: [{ name: 'Pizza', color: '#ea580c', enabled: true, weight: 1 }],
      settings: DEFAULT_WHEEL_SETTINGS,
    },
  });
}

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/share/:shareId" element={children} />
          <Route path="/share" element={children} />
          <Route path="*" element={children} />
        </Routes>
      </MemoryRouter>
    );
  };
}

function useSharedWheelWithLocation() {
  const shared = useSharedWheel();
  const location = useLocation();
  return {
    ...shared,
    href: `${location.pathname}${location.search}`,
  };
}

function renderSharedWheel(initialEntry: string) {
  return renderHook(() => useSharedWheelWithLocation(), {
    wrapper: wrapper(initialEntry),
  });
}

describe('useSharedWheel', () => {
  beforeEach(() => {
    resetWheelStore();
    persistStoresMock.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('resolves a valid share, copies the link, saves a copy, and clears status', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });
    useWheelStore.getState().createWheel({ id: 'existing', name: 'Food Picker' });

    const path = buildEncodedSharePath(validShareToken());
    const { result } = renderSharedWheel(path);

    expect(result.current.resolved.ok).toBe(true);
    if (!result.current.resolved.ok) {
      return;
    }
    expect(result.current.resolved.document.wheel.name).toBe('Food Picker');

    await act(async () => {
      await expect(result.current.copyShareLink()).resolves.toBe(true);
    });
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining(path));
    expect(result.current.status).toEqual({
      severity: 'success',
      message: SHARE_MESSAGES.copied('Food Picker'),
    });

    act(() => {
      expect(result.current.saveCopy()).toBe(true);
    });
    expect(persistStoresMock).toHaveBeenCalledTimes(1);
    expect(useWheelStore.getState().wheels.some((wheel) => wheel.name === 'Food Picker (copy)')).toBe(
      true,
    );
    expect(result.current.status).toEqual({
      severity: 'success',
      message: SHARE_MESSAGES.saved('Food Picker (copy)'),
    });
    expect(result.current.href).toBe(ROUTES.dashboard);

    act(() => {
      result.current.clearStatus();
    });
    expect(result.current.status).toBeNull();
  });

  it('reports errors when copying or saving without a resolved share', async () => {
    const { result } = renderSharedWheel(ROUTES.sharedWheel);

    expect(result.current.resolved.ok).toBe(false);

    await act(async () => {
      await expect(result.current.copyShareLink()).resolves.toBe(false);
    });
    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.missing,
    });

    act(() => {
      expect(result.current.saveCopy()).toBe(false);
    });
    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.missing,
    });
    expect(persistStoresMock).not.toHaveBeenCalled();
  });

  it('reports copy failure when the clipboard write fails', async () => {
    vi.spyOn(copyTextModule, 'copyText').mockResolvedValueOnce(false);
    const { result } = renderSharedWheel(buildEncodedSharePath(validShareToken()));

    await act(async () => {
      await expect(result.current.copyShareLink()).resolves.toBe(false);
    });

    expect(result.current.status).toEqual({
      severity: 'error',
      message: SHARE_MESSAGES.copyFailed,
    });
  });

  it('navigates to the dashboard from an unavailable share', async () => {
    const { result } = renderSharedWheel(`${ROUTES.sharedWheel}/remote-1`);

    expect(result.current.resolved.ok).toBe(false);
    if (result.current.resolved.ok) {
      return;
    }
    expect(result.current.resolved.reason).toBe('unavailable');

    act(() => {
      result.current.goToDashboard();
    });
    expect(result.current.href).toBe(ROUTES.dashboard);
  });
});
