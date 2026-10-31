import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Breadcrumbs, Link, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useAdjustment, useNotifyAdjustment } from '../../hooks/useAdjustments';
import { useLease } from '../../hooks/useLeases';
import { useUnit } from '../../hooks/useUnits';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { formatPercentage } from '../../utils/formatPercentage';
import type { Unit } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function formatFreq(months: number): string {
  if (months === 3) return 'trimestral';
  if (months === 4) return 'cuatrimestral';
  if (months === 6) return 'semestral';
  if (months === 12) return 'anual';
  return `cada ${months} meses`;
}

const sectionTitle = { fontWeight: 700, fontSize: '1.05rem', mb: 2 };

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
};

export default function AdjustmentPage() {
  const { leaseId, adjustmentId } = useParams<{ leaseId: string; adjustmentId: string }>();
  const navigate = useNavigate();
  const { data: adjustment, isLoading } = useAdjustment(leaseId!, adjustmentId!);
  const { data: lease } = useLease(leaseId!);
  const { data: unit } = useUnit(lease?.unitId || '');
  const notifyMut = useNotifyAdjustment();
  const toast = useToast();

  if (isLoading || !adjustment) return <LoadingSpinner />;

  const unitAddress = unit ? formatAddress(unit) : '';
  const isEstimated = adjustment.status === 'estimated';
  const hasRange = adjustment.minAmount && adjustment.maxAmount && adjustment.minAmount !== adjustment.maxAmount;

  const handleNotify = async () => {
    try {
      await notifyMut.mutateAsync({ leaseId: leaseId!, adjustmentId: adjustmentId! });
      toast.success('Notificación enviada al inquilino');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar la notificación');
    }
  };

  // Range bar calculations
  const minVal = parseFloat(adjustment.minAmount || '0');
  const maxVal = parseFloat(adjustment.maxAmount || '0');
  const padding = (maxVal - minVal) * 0.5 || maxVal * 0.03;
  const floor = Math.floor((minVal - padding) / 1000) * 1000;
  const ceil = Math.ceil((maxVal + padding) / 1000) * 1000;
  const range = ceil - floor || 1;
  const minPct = ((minVal - floor) / range) * 100;
  const maxPct = ((maxVal - floor) / range) * 100;

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate('/adjustments')}>
          Actualizaciones
        </Link>
        {unit && (
          <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>{unitAddress}</Typography>
        )}
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Ajuste del {formatDate(adjustment.effectiveDate)}
            </Typography>
            <StatusChip status={adjustment.status} />
          </Box>
          {lease && (
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              {lease.tenantName ? `Locatario: ${lease.tenantName} · ` : ''}
              {lease.adjustmentIndex} {formatFreq(lease.adjustmentFrequencyMonths)}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleNotify}
          disabled={notifyMut.isPending}
          sx={{ flexShrink: 0, ml: 2, textTransform: 'uppercase' }}
        >
          {notifyMut.isPending ? 'Enviando...' : `Notificar al ${lease?.tenantName ? 'locatario' : 'inquilino'}`}
        </Button>
      </Box>

      {/* Stat cards */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
        <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Alquiler vigente</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.5 }}>
            {formatCurrency(adjustment.previousRent)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Fecha de ajuste</Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.5 }}>
            {formatDate(adjustment.effectiveDate)}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Coeficiente {isEstimated ? 'estimado' : ''}
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.5 }}>
            {adjustment.minCoefficient && adjustment.maxCoefficient
              ? adjustment.minCoefficient === adjustment.maxCoefficient
                ? formatPercentage(adjustment.maxCoefficient)
                : `${formatPercentage(adjustment.minCoefficient)} – ${formatPercentage(adjustment.maxCoefficient)}`
              : '—'}
          </Typography>
        </Paper>
        <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
            Nuevo alquiler
          </Typography>
          <Typography sx={{ fontWeight: 700, fontSize: '1.15rem', mt: 0.5 }}>
            {adjustment.minAmount && adjustment.maxAmount
              ? hasRange
                ? `${formatCurrency(adjustment.minAmount)} – ${formatCurrency(adjustment.maxAmount)}`
                : formatCurrency(adjustment.maxAmount)
              : '—'}
          </Typography>
        </Paper>
      </Box>

      {/* Range visualization (only when there's a range) */}
      {hasRange && (
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider', mb: 3 }}>
          <Typography sx={sectionTitle}>Rango estimado</Typography>
          <Box sx={{ position: 'relative', mt: 5, mb: 2, mx: 1 }}>
            {/* Min label */}
            <Box sx={{ position: 'absolute', left: `${minPct}%`, top: -32, transform: 'translateX(-50%)' }}>
              <Chip
                label={formatCurrency(adjustment.minAmount!)}
                size="small"
                color="primary"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            </Box>
            {/* Max label */}
            <Box sx={{ position: 'absolute', left: `${maxPct}%`, top: -32, transform: 'translateX(-50%)' }}>
              <Chip
                label={formatCurrency(adjustment.maxAmount!)}
                size="small"
                color="primary"
                sx={{ fontWeight: 600, fontSize: '0.75rem' }}
              />
            </Box>

            {/* Track */}
            <Box sx={{ height: 4, bgcolor: 'grey.200', borderRadius: 2, position: 'relative' }}>
              {/* Active segment */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `${minPct}%`,
                  width: `${maxPct - minPct}%`,
                  height: '100%',
                  bgcolor: 'primary.main',
                  borderRadius: 2,
                }}
              />
              {/* Min dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `${minPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
              {/* Max dot */}
              <Box
                sx={{
                  position: 'absolute',
                  left: `${maxPct}%`,
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: 'primary.main',
                }}
              />
            </Box>

            {/* Scale */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatCurrency(String(floor))}
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {formatCurrency(String(ceil))}
              </Typography>
            </Box>
          </Box>

          {/* Pending data info */}
          {adjustment.pendingPeriods.length > 0 && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                mt: 2,
                p: 2,
                bgcolor: 'info.main',
                borderRadius: 1.5,
                color: 'info.contrastText',
                opacity: 0.9,
              }}
            >
              <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.25 }} />
              <Typography variant="body2">
                Dato pendiente: {lease?.adjustmentIndex || 'Índice'} de{' '}
                {adjustment.pendingPeriods.join(', ')}.
                Al publicarse, el monto pasa a ser definitivo y se notifica al locatario.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* Two-column: Detail + Notifications */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '3fr 2fr' }, gap: 3, alignItems: 'start' }}>
        {/* Left: Calculation detail */}
        <Paper variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden' }}>
          <Box sx={{ p: 3, pb: 0 }}>
            <Typography sx={sectionTitle}>Detalle del cálculo</Typography>
          </Box>
          {adjustment.pendingPeriods.length > 0 || adjustment.startIndexValue ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx}>Período</TableCell>
                    <TableCell sx={headerCellSx}>
                      Variación mensual ({lease?.adjustmentIndex || 'Índice'})
                    </TableCell>
                    <TableCell sx={headerCellSx}>Estado</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {/* Show published data if available */}
                  {adjustment.startIndexValue && (
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2">Índice base</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adjustment.startIndexValue}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status="confirmed" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  )}
                  {adjustment.endIndexValue && (
                    <TableRow>
                      <TableCell>
                        <Typography variant="body2">Índice final</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{adjustment.endIndexValue}</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={adjustment.status === 'final' ? 'confirmed' : 'pending'} variant="outlined" />
                      </TableCell>
                    </TableRow>
                  )}
                  {/* Pending periods */}
                  {adjustment.pendingPeriods.map((period) => (
                    <TableRow key={period}>
                      <TableCell>
                        <Typography variant="body2">{period}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.secondary' }}>—</Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status="pending" variant="outlined" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ px: 3, pb: 3 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                El detalle del cálculo estará disponible cuando se publiquen los datos del índice.
              </Typography>
            </Box>
          )}
        </Paper>

        {/* Right: Summary */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <Typography sx={sectionTitle}>Resumen</Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Coefficient */}
            {adjustment.minCoefficient && (
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <EmailOutlinedIcon sx={{ color: 'primary.main', fontSize: 20, mt: 0.25 }} />
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {isEstimated ? 'Estimación actualizada' : 'Ajuste definitivo'}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    {hasRange
                      ? `Rango ${formatCurrency(adjustment.minAmount!)} – ${formatCurrency(adjustment.maxAmount!)}`
                      : adjustment.maxAmount
                        ? `${formatCurrency(adjustment.maxAmount)} desde el ${formatDate(adjustment.effectiveDate)}`
                        : 'Pendiente de cálculo'}
                  </Typography>
                  {adjustment.updatedAt && (
                    <Typography variant="caption" sx={{ display: 'block', color: 'text.disabled' }}>
                      Actualizado el {formatDate(adjustment.updatedAt)}
                    </Typography>
                  )}
                </Box>
              </Box>
            )}

            {/* Previous rent reference */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <EmailOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20, mt: 0.25 }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>Alquiler anterior</Typography>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatCurrency(adjustment.previousRent)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
