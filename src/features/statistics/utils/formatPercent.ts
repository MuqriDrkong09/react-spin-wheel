export function formatPercent(value: number): string {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)}%`;
}

export function formatTimes(count: number): string {
  return count === 1 ? '1 time' : `${count} times`;
}
