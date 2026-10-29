import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { useSpinScreen } from '@/features/spin/hooks/useSpinScreen';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';
import { SELECTION_MODE } from '@/types/wheel';

function wrapper(initialEntry: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initialEntry]}>{children}</MemoryRouter>;
  };
}

function useSpinScreenWithLocation() {
  const screen = useSpinScreen();
  const location = useLocation();

  return {
    ...screen,
    href: `${location.pathname}${location.search}`,
  };
}

function renderSpinScreen(initialEntry = ROUTES.spin) {
  return renderHook(() => useSpinScreenWithLocation(), {
    wrapper: wrapper(initialEntry),
  });
}

function seedWheels() {
  useWheelStore.getState().createWheel({ id: 'food', name: 'Food' });
  useWheelStore.getState().createWheel({ id: 'chores', name: 'Chores' });
  useWheelStore.getState().createWheel({ id: 'alpha', name: 'Alpha' });
  useWheelStore.getState().createWheel({ id: 'beta', name: 'Beta' });

  useWheelStore.setState((state) => ({
    wheels: state.wheels.map((wheel) => {
      if (wheel.id === 'alpha' || wheel.id === 'beta') {
        return { ...wheel, updatedAt: '2026-03-01T00:00:00.000Z' };
      }

      if (wheel.id === 'food') {
        return { ...wheel, updatedAt: '2026-02-01T00:00:00.000Z' };
      }

      return { ...wheel, updatedAt: '2026-01-01T00:00:00.000Z' };
    }),
  }));
}

describe('useSpinScreen', () => {
  beforeEach(() => {
    resetWheelStore();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('asks the user to choose a wheel when none is in the URL', () => {
    seedWheels();
    const { result } = renderSpinScreen();

    expect(result.current.wheel).toBeUndefined();
    expect(result.current.needsWheelChoice).toBe(true);
    expect(result.current.isMissingWheel).toBe(false);
    expect(result.current.availableWheels.map((wheel) => wheel.id)).toEqual([
      'alpha',
      'beta',
      'food',
      'chores',
    ]);
  });

  it('does not ask for a wheel when the store is empty', () => {
    const { result } = renderSpinScreen();

    expect(result.current.availableWheels).toEqual([]);
    expect(result.current.needsWheelChoice).toBe(false);
    expect(result.current.isMissingWheel).toBe(false);
  });

  it('loads the requested wheel and marks it active', () => {
    seedWheels();
    const { result } = renderSpinScreen(withWheelId(ROUTES.spin, 'food'));

    expect(result.current.wheel?.id).toBe('food');
    expect(result.current.needsWheelChoice).toBe(false);
    expect(result.current.isMissingWheel).toBe(false);
    expect(useWheelStore.getState().activeWheelId).toBe('food');
  });

  it('does not reset the active wheel when it already matches the URL', () => {
    seedWheels();
    useWheelStore.getState().setActiveWheel('food');
    const setActiveWheel = vi.spyOn(useWheelStore.getState(), 'setActiveWheel');

    renderSpinScreen(withWheelId(ROUTES.spin, 'food'));

    expect(setActiveWheel).not.toHaveBeenCalled();
    expect(useWheelStore.getState().activeWheelId).toBe('food');
  });

  it('reports a missing wheel without changing the active selection', () => {
    seedWheels();
    const { result } = renderSpinScreen(withWheelId(ROUTES.spin, 'ghost'));

    expect(result.current.wheel).toBeUndefined();
    expect(result.current.isMissingWheel).toBe(true);
    expect(result.current.needsWheelChoice).toBe(false);
    expect(useWheelStore.getState().activeWheelId).toBeNull();
  });

  it('selects a wheel, clears the selection, and navigates to create or dashboard', () => {
    seedWheels();
    const { result } = renderSpinScreen();

    act(() => {
      result.current.selectWheel('food');
    });
    expect(useWheelStore.getState().activeWheelId).toBe('food');
    expect(result.current.href).toBe(withWheelId(ROUTES.spin, 'food'));

    act(() => {
      result.current.clearWheelSelection();
    });
    expect(result.current.href).toBe(ROUTES.spin);

    act(() => {
      result.current.goToCreate();
    });
    expect(result.current.href).toBe(ROUTES.createWheel);

    act(() => {
      result.current.goToDashboard();
    });
    expect(result.current.href).toBe(ROUTES.dashboard);
  });

  it('updates selection mode and remove-winner only when a wheel is in the URL', () => {
    seedWheels();
    const withoutWheel = renderSpinScreen();

    act(() => {
      withoutWheel.result.current.setSelectionMode(SELECTION_MODE.automatic);
      withoutWheel.result.current.setRemoveWinner(true);
    });

    expect(useWheelStore.getState().getWheel('food')?.settings.selectionMode).toBe(
      SELECTION_MODE.manual,
    );
    expect(useWheelStore.getState().getWheel('food')?.settings.removeWinner).toBe(false);

    const withWheel = renderSpinScreen(withWheelId(ROUTES.spin, 'food'));

    act(() => {
      withWheel.result.current.setSelectionMode(SELECTION_MODE.ask);
      withWheel.result.current.setRemoveWinner(true);
    });

    expect(useWheelStore.getState().getWheel('food')?.settings.selectionMode).toBe(SELECTION_MODE.ask);
    expect(useWheelStore.getState().getWheel('food')?.settings.removeWinner).toBe(true);
  });
});
