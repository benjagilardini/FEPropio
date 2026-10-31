import { Chip } from '@mui/material';

const colorMap: Record<string, 'default' | 'success' | 'error' | 'warning' | 'info' | 'primary'> = {
  draft: 'default',
  active: 'success',
  ended: 'error',
  estimated: 'warning',
  scheduled: 'default',
  final: 'success',
  submitted: 'warning',
  confirmed: 'success',
  flagged: 'error',
  open: 'info',
  inProgress: 'warning',
  resolved: 'success',
  closed: 'default',
  pending: 'warning',
  corrected: 'primary',
  occupied: 'success',
  vacant: 'default',
};

const labelMap: Record<string, string> = {
  draft: 'Borrador',
  active: 'Vigente',
  ended: 'Finalizado',
  estimated: 'Estimado',
  scheduled: 'Programado',
  final: 'Final',
  submitted: 'Enviado',
  confirmed: 'Confirmado',
  flagged: 'Observado',
  open: 'Abierto',
  inProgress: 'En progreso',
  resolved: 'Resuelto',
  closed: 'Cerrado',
  pending: 'Pendiente',
  corrected: 'Corregido',
  occupied: 'Ocupada',
  vacant: 'Vacante',
};

const outlinedStatuses = new Set(['occupied', 'vacant']);

interface Props {
  status: string;
  size?: 'small' | 'medium';
  variant?: 'filled' | 'outlined';
}

export default function StatusChip({ status, size = 'small', variant }: Props) {
  const chipVariant = variant ?? (outlinedStatuses.has(status) ? 'outlined' : 'filled');

  return (
    <Chip
      label={labelMap[status] || status}
      color={colorMap[status] || 'default'}
      size={size}
      variant={chipVariant}
    />
  );
}
