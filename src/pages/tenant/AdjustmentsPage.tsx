import {
  Box, Typography, Paper, Chip, Divider, LinearProgress, alpha, useTheme,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useQuery } from '@tanstack/react-query';
import { useTenantLeases } from '../../hooks/useLeases';
import { adjustmentApi } from '../../api/adjustmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { TimelineEntry } from '../../types';

const FREQUENCY_LABEL: Record<number, string> = {
  1: 'Mensual', 2: 'Bimestral', 3: 'Trimestral',
  4: 'Cuatrimestral', 6: 'Semestral', 12: 'Anual',
};

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

function InfoRow({ label, value, bold, color }: {
  label: string; value: string | null | undefined; bold?: boolean; color?: string;
}) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500, color: color || 'text.primary', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Box>
  );
}

function StatCard({ label, value, subtitle, color }: {
  label: string; value: string; subtitle?: string; color?: string;
}) {
  return (
    <Box sx={{
      flex: 1, p: 1.5, bgcolor: '#fff', border: '1px solid', borderColor: 'divider',
      borderRadius: 2, textAlign: 'center', minWidth: 0,
    }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: color || 'primary.main', fontSize: '1.1rem' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}

/* ---- Range Bar Visualization ---- */

function RangeBar({ entry, indexName }: { entry: TimelineEntry; indexName: string }) {
  const theme = useTheme();
  const hasRange = entry.minAmount !== entry.maxAmount;
  const isConfirmed = entry.status === 'confirmed';

  // Scale: from previousRent to maxAmount + some padding
  const scaleMin = entry.previousRent;
  const scaleMax = entry.maxAmount * 1.02;
  const range = scaleMax - scaleMin || 1;

  const minPct = hasRange ? ((entry.minAmount - scaleMin) / range) * 100 : 0;
  const maxPct = ((entry.maxAmount - scaleMin) / range) * 100;

  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <TrendingUpIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          Próximo ajuste
        </Typography>
        <Chip
          label={isConfirmed ? 'Confirmado' : 'Estimado'}
          size="small"
          color={isConfirmed ? 'success' : 'primary'}
          sx={{ ml: 'auto' }}
        />
      </Box>

      {/* Date & current rent */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Fecha efectiva</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatDate(entry.effectiveDate)}</Typography>
        </Box>
        <Box sx={{ textAlign: 'right' }}>
          <Typography variant="caption" sx={{ color: 'text.secondary' }}>Alquiler actual</Typography>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>{formatCurrency(entry.previousRent)}</Typography>
        </Box>
      </Box>

      {/* Range bar */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary', mb: 1, display: 'block' }}>
          {hasRange ? 'Rango estimado del nuevo alquiler' : 'Nuevo alquiler'}
        </Typography>

        {/* Amount labels */}
        <Box sx={{ position: 'relative', height: 32, mb: 0.5 }}>
          {hasRange ? (
            <>
              <Chip
                label={formatCurrency(entry.minAmount)}
                size="small"
                sx={{
                  position: 'absolute',
                  left: `${minPct}%`,
                  transform: 'translateX(-50%)',
                  bgcolor: alpha(theme.palette.primary.main, 0.1),
                  color: 'primary.main',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  height: 28,
                }}
              />
              <Chip
                label={formatCurrency(entry.maxAmount)}
                size="small"
                sx={{
                  position: 'absolute',
                  left: `${maxPct}%`,
                  transform: 'translateX(-50%)',
                  bgcolor: 'primary.main',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  height: 28,
                }}
              />
            </>
          ) : (
            <Chip
              label={formatCurrency(entry.maxAmount)}
              size="small"
              sx={{
                position: 'absolute',
                left: `${maxPct}%`,
                transform: 'translateX(-50%)',
                bgcolor: 'primary.main',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                height: 28,
              }}
            />
          )}
        </Box>

        {/* Track */}
        <Box sx={{ position: 'relative', height: 8, bgcolor: alpha(theme.palette.grey[300], 0.5), borderRadius: 4 }}>
          {hasRange ? (
            <Box sx={{
              position: 'absolute',
              left: `${minPct}%`,
              width: `${maxPct - minPct}%`,
              height: '100%',
              bgcolor: alpha(theme.palette.primary.main, 0.35),
              borderRadius: 4,
            }}>
              {/* Min dot */}
              <Box sx={{
                position: 'absolute', left: 0, top: '50%', transform: 'translate(-50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: '#fff', border: `3px solid ${theme.palette.primary.main}`,
              }} />
              {/* Max dot */}
              <Box sx={{
                position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
              }} />
            </Box>
          ) : (
            <Box sx={{
              position: 'absolute',
              left: 0,
              width: `${maxPct}%`,
              height: '100%',
              bgcolor: theme.palette.primary.main,
              borderRadius: 4,
            }}>
              <Box sx={{
                position: 'absolute', right: 0, top: '50%', transform: 'translate(50%, -50%)',
                width: 14, height: 14, borderRadius: '50%',
                bgcolor: theme.palette.primary.main,
                border: '2px solid #fff',
                boxShadow: 1,
              }} />
            </Box>
          )}
        </Box>

        {/* Scale labels */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
            {formatCurrency(scaleMin)}
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
            {formatCurrency(scaleMax)}
          </Typography>
        </Box>
      </Box>

      {/* Variation */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        mt: 1.5, pt: 1.5, borderTop: '1px solid', borderColor: 'divider',
      }}>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>Variación estimada</Typography>
        <Typography variant="body2" sx={{ fontWeight: 700, color: 'error.main' }}>
          {hasRange
            ? `${formatPct(((entry.minAmount / entry.previousRent) - 1) * 100)} a ${formatPct(entry.variation)}`
            : formatPct(entry.variation)}
        </Typography>
      </Box>

      {/* Pending info */}
      {entry.pendingPeriods.length > 0 && (
        <Box sx={{
          mt: 1.5, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06),
          borderRadius: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1,
        }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.1 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark' }}>
              Pendiente de publicación
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
              El monto se confirmará cuando se publiquen los valores del {indexName} para los
              períodos pendientes. El rango se reduce a medida que se difunden los datos faltantes.
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

/* ---- Applied adjustments list ---- */

function AppliedAdjustmentRow({ entry }: { entry: TimelineEntry }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 1 }}>
      <CheckCircleIcon sx={{ fontSize: 16, color: 'success.main', flexShrink: 0 }} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" sx={{ fontWeight: 500 }}>
          {formatMonthYear(entry.effectiveDate)}
        </Typography>
      </Box>
      <Typography variant="body2" sx={{ color: 'text.secondary', flexShrink: 0 }}>
        {formatCurrency(entry.previousRent)} → {formatCurrency(entry.maxAmount)}
      </Typography>
      <Typography variant="caption" sx={{ fontWeight: 600, color: 'error.main', flexShrink: 0, minWidth: 60, textAlign: 'right' }}>
        {formatPct(entry.variation)}
      </Typography>
    </Box>
  );
}

/* ---- Main Page ---- */

export default function AdjustmentsPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];

  const { data: summary, isLoading } = useQuery({
    queryKey: ['adjustment-summary', activeLease?.id],
    queryFn: () => adjustmentApi.getSummary(activeLease!.id),
    enabled: !!activeLease,
  });

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenés un contrato activo." />;
  if (!summary) return <EmptyState message="No hay datos de ajustes disponibles." />;

  const { daysUntilNext, indexStats, timeline, contractProgress, lease } = summary;
  const freq = FREQUENCY_LABEL[lease.adjustmentFrequencyMonths] || `Cada ${lease.adjustmentFrequencyMonths} meses`;
  const theme = useTheme();

  const nextIdx = timeline.findIndex((t) => new Date(t.effectiveDate) > new Date());
  const nextEntry = nextIdx >= 0 ? timeline[nextIdx] : null;
  const nextDate = nextEntry?.effectiveDate ?? null;
  const appliedEntries = timeline.filter((t) => t.status === 'confirmed').sort(
    (a, b) => b.effectiveDate.localeCompare(a.effectiveDate),
  );

  return (
    <Box>
      <PageHeader
        title="Ajustes"
        chips={
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Chip label={lease.adjustmentIndex} size="small" color="primary" variant="outlined" />
            <Chip label={freq} size="small" variant="outlined" />
          </Box>
        }
      />

      {/* Stats bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <StatCard label="Alquiler actual" value={formatCurrency(summary.currentRent)} />
        <StatCard
          label="Variación acumulada"
          value={formatPct(summary.totalVariation)}
          subtitle={`desde ${formatDate(lease.startDate)}`}
          color={summary.totalVariation > 0 ? theme.palette.error.main : theme.palette.success.main}
        />
        <StatCard
          label={`Promedio mensual ${lease.adjustmentIndex}`}
          value={formatPct(indexStats.avgMonthlyVariation)}
          subtitle="últimos meses"
          color={theme.palette.info.main}
        />
        {daysUntilNext !== null && (
          <StatCard
            label="Próximo ajuste"
            value={`${daysUntilNext} días`}
            subtitle={nextDate ? formatMonthYear(nextDate) : undefined}
            color={theme.palette.primary.main}
          />
        )}
      </Box>

      {/* Two columns: Range bar + Contract / Applied history */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* LEFT: Next adjustment range + Contract */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {nextEntry && (
            <RangeBar entry={nextEntry} indexName={lease.adjustmentIndex} />
          )}

          {/* Contract summary */}
          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
            <SectionTitle
              icon={<DescriptionOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
              title="Contrato"
            />
            <InfoRow label="Alquiler inicial" value={formatCurrency(lease.initialRent)} />
            <Divider />
            <InfoRow label="Alquiler actual" value={formatCurrency(summary.currentRent)} bold />
            <Divider />
            <InfoRow label="Inicio" value={formatDate(lease.startDate)} />
            <Divider />
            <InfoRow label="Finalización" value={formatDate(lease.endDate)} />
            <Divider />
            <InfoRow label="Índice" value={lease.adjustmentIndex} />
            <Divider />
            <InfoRow label="Frecuencia" value={freq.toLowerCase()} />
            <Box sx={{ mt: 1.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>Progreso del contrato</Typography>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>{contractProgress}%</Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={contractProgress}
                sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.primary.main, 0.1) }}
              />
            </Box>
          </Paper>
        </Box>

        {/* RIGHT: Applied adjustments */}
        {appliedEntries.length > 0 && (
          <Box sx={{ width: 420, flexShrink: 0 }}>
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
              <SectionTitle
                icon={<CheckCircleIcon sx={{ fontSize: 20, color: 'success.main' }} />}
                title="Ajustes aplicados"
              />
              {appliedEntries.map((entry, i) => (
                <Box key={entry.effectiveDate}>
                  {i > 0 && <Divider />}
                  <AppliedAdjustmentRow entry={entry} />
                </Box>
              ))}
            </Paper>
          </Box>
        )}
      </Box>
    </Box>
  );
}
