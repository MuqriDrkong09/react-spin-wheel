import '@testing-library/jest-dom/vitest';

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string): MediaQueryList => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  }),
});

class ResizeObserverMock implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;
  private readonly observed = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    if (this.observed.has(target)) {
      return;
    }

    this.observed.add(target);
    this.callback(
      [
        {
          target,
          contentRect: {
            width: 640,
            height: 280,
            x: 0,
            y: 0,
            top: 0,
            left: 0,
            bottom: 280,
            right: 640,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        },
      ],
      this,
    );
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }
}

window.ResizeObserver = ResizeObserverMock;
