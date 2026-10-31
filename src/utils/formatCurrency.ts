export function formatCurrency(value: string | number | null | undefined): string {
  if (value == null) return '-';
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2,
  }).format(num);
}
