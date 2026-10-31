export function formatPercentage(value: string | number | null | undefined): string {
  if (value == null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return `${num.toFixed(2)}%`;
}
