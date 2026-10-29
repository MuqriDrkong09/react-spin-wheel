import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { MemoryRouter, useLocation } from 'react-router-dom';

import { ROUTES, withWheelId } from '@/constants/routes';
import { useCreateWheel } from '@/features/create-wheel/hooks/useCreateWheel';
import type { CreateWheelFormValues } from '@/features/create-wheel/schema';
import { loadPersistedState } from '@/services/storage/persistedState';
import { storageService } from '@/services/storage/storageService';
import { resetWheelStore, useWheelStore } from '@/stores/wheelStore';

const values: CreateWheelFormValues = {
  name: 'Pizza Night',
  description: 'Weekend dinner',
  category: 'Food',
  icon: '🍕',
  items: [{ name: 'Pepperoni' }, { name: 'Margherita' }],
};

function wrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter initialEntries={[ROUTES.createWheel]}>{children}</MemoryRouter>;
}

function useCreateWheelWithLocation() {
  const actions = useCreateWheel();
  const location = useLocation();

  return {
    ...actions,
    href: `${location.pathname}${location.search}`,
  };
}

describe('useCreateWheel', () => {
  beforeEach(() => {
    window.localStorage.clear();
    storageService.clearMemory();
    resetWheelStore();
  });

  it('creates, persists, and opens the editor for a submitted wheel', () => {
    const { result } = renderHook(() => useCreateWheelWithLocation(), { wrapper });

    act(() => {
      result.current.submit(values);
    });

    const created = useWheelStore.getState().wheels[0];

    expect(created?.name).toBe('Pizza Night');
    expect(created?.description).toBe('Weekend dinner');
    expect(created?.category).toBe('Food');
    expect(created?.icon).toBe('🍕');
    expect(created?.items.map((item) => item.name)).toEqual(['Pepperoni', 'Margherita']);
    expect(useWheelStore.getState().activeWheelId).toBe(created?.id);
    expect(loadPersistedState().wheels[0]?.name).toBe('Pizza Night');
    expect(result.current.href).toBe(withWheelId(ROUTES.wheelEditor, created?.id ?? ''));
  });

  it('omits empty optional fields on the created wheel', () => {
    const { result } = renderHook(() => useCreateWheelWithLocation(), { wrapper });

    act(() => {
      result.current.submit({
        ...values,
        description: '',
        category: '',
        icon: '',
        items: [{ name: 'Yes' }],
      });
    });

    const created = useWheelStore.getState().wheels[0];

    expect(created?.name).toBe('Pizza Night');
    expect(created?.description).toBeUndefined();
    expect(created?.category).toBeUndefined();
    expect(created?.icon).toBeUndefined();
    expect(created?.items).toHaveLength(1);
    expect(result.current.href).toBe(withWheelId(ROUTES.wheelEditor, created?.id ?? ''));
  });

  it('returns to the dashboard without creating a wheel', () => {
    const { result } = renderHook(() => useCreateWheelWithLocation(), { wrapper });

    act(() => {
      result.current.cancel();
    });

    expect(useWheelStore.getState().wheels).toHaveLength(0);
    expect(useWheelStore.getState().activeWheelId).toBeNull();
    expect(loadPersistedState().wheels).toHaveLength(0);
    expect(result.current.href).toBe(ROUTES.dashboard);
  });
});
