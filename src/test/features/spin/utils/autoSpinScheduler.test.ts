import { createAutoSpinScheduler } from '@/features/spin/utils/autoSpinScheduler';

describe('createAutoSpinScheduler', () => {
  it('runs a scheduled callback once after the delay', () => {
    const setTimeout = vi.fn<(handler: () => void, delayMs: number) => number>();
    const clearTimeout = vi.fn<(id: number) => void>();
    let queued: (() => void) | undefined;
    setTimeout.mockImplementation((handler, delayMs) => {
      queued = handler;
      expect(delayMs).toBe(250);
      return 7;
    });

    const callback = vi.fn();
    const scheduler = createAutoSpinScheduler({ setTimeout, clearTimeout });
    scheduler.schedule(callback, 250);

    expect(scheduler.isPending()).toBe(true);
    expect(callback).not.toHaveBeenCalled();
    queued?.();
    expect(callback).toHaveBeenCalledTimes(1);
    expect(scheduler.isPending()).toBe(false);
    expect(clearTimeout).not.toHaveBeenCalled();
  });

  it('cancels a pending delay without invoking the callback', () => {
    const setTimeout = vi.fn<(handler: () => void, delayMs: number) => number>().mockReturnValue(3);
    const clearTimeout = vi.fn<(id: number) => void>();
    const callback = vi.fn();
    const scheduler = createAutoSpinScheduler({ setTimeout, clearTimeout });

    scheduler.schedule(callback, 1_000);
    scheduler.cancel();

    expect(clearTimeout).toHaveBeenCalledWith(3);
    expect(scheduler.isPending()).toBe(false);
    expect(callback).not.toHaveBeenCalled();
  });

  it('replaces a pending timeout instead of chaining recursive timers', () => {
    const setTimeout = vi.fn<(handler: () => void, delayMs: number) => number>();
    const clearTimeout = vi.fn<(id: number) => void>();
    setTimeout.mockReturnValueOnce(1).mockReturnValueOnce(2);
    const first = vi.fn();
    const second = vi.fn();
    const scheduler = createAutoSpinScheduler({ setTimeout, clearTimeout });

    scheduler.schedule(first, 400);
    scheduler.schedule(second, 100);

    expect(clearTimeout).toHaveBeenCalledWith(1);
    expect(setTimeout).toHaveBeenCalledTimes(2);
    expect(setTimeout.mock.calls[1]?.[1]).toBe(100);

    const replaced = setTimeout.mock.calls[0]?.[0];
    const latest = setTimeout.mock.calls[1]?.[0];
    replaced?.();
    expect(first).not.toHaveBeenCalled();
    latest?.();
    expect(second).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
  });

  it('treats a negative delay as zero and ignores cancelled generations', () => {
    const setTimeout = vi.fn<(handler: () => void, delayMs: number) => number>();
    const clearTimeout = vi.fn<(id: number) => void>();
    setTimeout.mockReturnValue(9);
    const callback = vi.fn();
    const scheduler = createAutoSpinScheduler({ setTimeout, clearTimeout });

    scheduler.schedule(callback, -20);
    expect(setTimeout.mock.calls[0]?.[1]).toBe(0);

    scheduler.cancel();
    setTimeout.mock.calls[0]?.[0]();
    expect(callback).not.toHaveBeenCalled();
  });
});
