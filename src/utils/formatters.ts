import { frequencyLabels } from '../constants/labels';

export function formatFreq(months: number): string {
  return (frequencyLabels[months] || `Cada ${months} meses`).toLowerCase();
}

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

export function formatVariation(coef: string | undefined): string {
  if (!coef) return '-';
  const pct = (parseFloat(coef) - 1) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

export function formatMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export function formatShortMonth(period: string): string {
  const [y, m] = period.split('-');
  const d = new Date(+y, +m - 1, 1);
  const name = d.toLocaleDateString('es-AR', { month: 'short' });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`;
}

export function formatLongMonth(period: string): string {
  const [y, m] = period.split('-');
  const d = new Date(+y, +m - 1, 1);
  const name = d.toLocaleDateString('es-AR', { month: 'long' });
  return `${name.charAt(0).toUpperCase() + name.slice(1)} ${y}`;
}

export function generateMonths(startDate: string, endDate: string): string[] {
  const months: string[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let cur = new Date(start.getFullYear(), start.getMonth(), 1);
  const last = new Date(end.getFullYear(), end.getMonth(), 1);
  while (cur <= last) {
    months.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`);
    cur.setMonth(cur.getMonth() + 1);
  }
  return months;
}
