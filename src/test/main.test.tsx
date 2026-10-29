import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { createRoot, render, startStorePersistence } = vi.hoisted(() => {
  const render = vi.fn();

  return {
    render,
    createRoot: vi.fn(() => ({ render, unmount: vi.fn() })),
    startStorePersistence: vi.fn(() => vi.fn()),
  };
});

vi.mock('react-dom/client', () => ({
  createRoot,
}));

vi.mock('@/services/storage/storePersistence', () => ({
  startStorePersistence,
}));

describe('main', () => {
  beforeEach(() => {
    vi.resetModules();
    createRoot.mockClear();
    render.mockClear();
    startStorePersistence.mockClear();
    document.body.replaceChildren();
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it('starts persistence and mounts the app on #root', async () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.append(root);

    await import('@/main');
    const { App } = await import('@/app/App');

    expect(startStorePersistence).toHaveBeenCalledTimes(1);
    expect(createRoot).toHaveBeenCalledWith(root);
    expect(render).toHaveBeenCalledTimes(1);

    const tree = render.mock.calls[0]?.[0] as { type: unknown; props: { children: { type: unknown } } };
    expect(tree?.type).toBe(StrictMode);
    expect(tree?.props.children.type).toBe(App);
  });

  it('throws when the root element is missing', async () => {
    await expect(import('@/main')).rejects.toThrow('Root element "#root" was not found.');
    expect(startStorePersistence).toHaveBeenCalledTimes(1);
    expect(createRoot).not.toHaveBeenCalled();
  });
});
