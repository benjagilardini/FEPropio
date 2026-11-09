import type { Unit } from '../types';

export function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.\u00b0`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

export function formatAddressSecondary(unit: Unit): string | null {
  const parts: string[] = [];
  if (unit.address.neighborhood) parts.push(unit.address.neighborhood);
  if (unit.address.city) parts.push(unit.address.city);
  return parts.length > 0 ? parts.join(', ') : null;
}
