import { Typography, Chip } from '@mui/material';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlineOutlined';

const STATUS_CFG: Record<string, { label: string; color: 'success' | 'info' | 'error'; icon: React.ReactElement }> = {
  confirmed: { label: 'Confirmado', color: 'success', icon: <CheckCircleOutlinedIcon sx={{ fontSize: 15 }} /> },
  submitted: { label: 'Por revisar', color: 'info', icon: <HourglassEmptyIcon sx={{ fontSize: 15 }} /> },
  flagged:   { label: 'Observado',  color: 'error', icon: <ErrorOutlineIcon sx={{ fontSize: 15 }} /> },
};

export function PaymentStatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status];
  if (!cfg) return <Typography variant="caption" color="text.disabled">Sin pago</Typography>;
  return (
    <Chip
      icon={cfg.icon}
      label={cfg.label}
      size="small"
      color={cfg.color}
      variant="outlined"
      sx={{ fontWeight: 500, fontSize: '0.75rem', height: 24 }}
    />
  );
}
