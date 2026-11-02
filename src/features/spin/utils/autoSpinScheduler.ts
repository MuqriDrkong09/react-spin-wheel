export interface AutoSpinTimerApi {
  setTimeout: (handler: () => void, delayMs: number) => ReturnType<typeof setTimeout>;
  clearTimeout: (id: ReturnType<typeof setTimeout>) => void;
}

export interface AutoSpinScheduler {
  schedule: (callback: () => void, delayMs: number) => void;
  cancel: () => void;
  isPending: () => boolean;
}

const defaultTimers: AutoSpinTimerApi = {
  setTimeout: (handler, delayMs) => globalThis.setTimeout(handler, delayMs),
  clearTimeout: (id) => globalThis.clearTimeout(id),
};

export function createAutoSpinScheduler(timers: AutoSpinTimerApi = defaultTimers): AutoSpinScheduler {
  let handle: ReturnType<typeof setTimeout> | undefined;
  let generation = 0;

  return {
    schedule(callback, delayMs) {
      if (handle !== undefined) {
        timers.clearTimeout(handle);
        handle = undefined;
      }

      const token = generation + 1;
      generation = token;
      const wait = Math.max(0, delayMs);

      handle = timers.setTimeout(() => {
        handle = undefined;
        if (token !== generation) {
          return;
        }

        callback();
      }, wait);
    },
    cancel() {
      generation += 1;
      if (handle === undefined) {
        return;
      }

      timers.clearTimeout(handle);
      handle = undefined;
    },
    isPending() {
      return handle !== undefined;
    },
  };
}
