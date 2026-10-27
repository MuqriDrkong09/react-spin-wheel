export function formatDuration(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) {
    return '0s';
  }

  if (ms < 1000) {
    return `${Math.round(ms)}ms`;
  }

  const totalSeconds = ms / 1000;
  if (totalSeconds < 60) {
    const rounded = totalSeconds < 10 ? totalSeconds.toFixed(1) : Math.round(totalSeconds).toString();
    return `${rounded.replace(/\.0$/, '')}s`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}
