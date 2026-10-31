import {
  Box, Typography, Paper, Chip, Divider,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQuery } from '@tanstack/react-query';
import { useTenantLeases } from '../../hooks/useLeases';
import { adjustmentApi } from '../../api/adjustmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';

const frequencyLabel: Record<number, string> = {
  1: 'Mensual',
  2: 'Bimestral',
  3: 'Trimestral',
  4: 'Cuatrimestral',
  6: 'Semestral',
  12: 'Anual',
};

function formatVariation(coefficient: string | undefined): string {
  if (!coefficient) return '-';
  const pct = (parseFloat(coefficient) - 1) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 500, textAlign: 'right' }}>{value}</Typography>
    </Box>
  );
}

export default function AdjustmentsPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];

  const { data, isLoading } = useQuery({
    queryKey: ['adjustments', activeLease?.id, 'all'],
    queryFn: () => adjustmentApi.list(activeLease!.id, { page: 1, limit: 50 }),
    enabled: !!activeLease,
  });

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenés un contrato activo." />;

  const adjustments = data?.data || [];
  const now = new Date();
  const nextAdj = adjustments.find((a) => new Date(a.effectiveDate) > now) || null;
  const pastAdjs = adjustments.filter((a) => new Date(a.effectiveDate) <= now).reverse();

  const currentRent = nextAdj?.previousRent
    || (pastAdjs.length > 0 ? pastAdjs[0].maxAmount : null)
    || activeLease.initialRent;

  const totalVariation = currentRent && activeLease.initialRent
    ? (parseFloat(currentRent) / parseFloat(activeLease.initialRent) - 1) * 100
    : 0;

  const freq = frequencyLabel[activeLease.adjustmentFrequencyMonths]
    || `Cada ${activeLease.adjustmentFrequencyMonths} meses`;

  if (adjustments.length === 0) {
    return (
      <Box>
        <PageHeader
          title="Ajustes"
          chips={<Chip label={activeLease.adjustmentIndex} size="small" color="primary" variant="outlined" />}
        />
        <EmptyState
          message="No hay ajustes generados"
          description="Los ajustes aparecerán aquí a medida que se calculen según tu contrato."
          Icon={TrendingUpIcon}
        />
      </Box>
    );
  }

  const isEstimated = nextAdj?.status === 'estimated';
  const hasRange = isEstimated && nextAdj.minAmount !== nextAdj.maxAmount;

  return (
    <Box>
      <PageHeader
        title="Ajustes"
        chips={
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Chip label={activeLease.adjustmentIndex} size="small" color="primary" variant="outlined" />
            <Chip label={freq} size="small" variant="outlined" />
          </Box>
        }
      />

      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* Left — Next adjustment */}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {nextAdj ? (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                <TrendingUpIcon sx={{ fontSize: 20, color: 'primary.main' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Próximo ajuste</Typography>
                <Box sx={{ ml: 'auto' }}><StatusChip status={nextAdj.status} /></Box>
              </Box>

              <InfoRow label="Fecha efectiva" value={formatDate(nextAdj.effectiveDate)} />
              <Divider />
              <InfoRow label="Alquiler actual" value={formatCurrency(nextAdj.previousRent)} />
              <Divider />
              <InfoRow
                label={isEstimated ? 'Estimación' : 'Nuevo alquiler'}
                value={
                  hasRange
                    ? `${formatCurrency(nextAdj.minAmount)} – ${formatCurrency(nextAdj.maxAmount)}`
                    : formatCurrency(nextAdj.maxAmount)
                }
              />
              <Divider />
              <InfoRow
                label="Variación"
                value={
                  hasRange
                    ? `${formatVariation(nextAdj.minCoefficient)} – ${formatVariation(nextAdj.maxCoefficient)}`
                    : formatVariation(nextAdj.maxCoefficient)
                }
              />
              {nextAdj.startIndexValue && (
                <>
                  <Divider />
                  <InfoRow label={`${activeLease.adjustmentIndex} inicio`} value={nextAdj.startIndexValue} />
                </>
              )}
              {nextAdj.endIndexValue && (
                <>
                  <Divider />
                  <InfoRow label={`${activeLease.adjustmentIndex} fin`} value={nextAdj.endIndexValue} />
                </>
              )}

              {nextAdj.pendingPeriods.length > 0 && (
                <Box sx={{ mt: 'auto', pt: 1.5 }}>
                  <Box sx={{ p: 1.5, bgcolor: '#fff8e1', borderRadius: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    <InfoOutlinedIcon sx={{ fontSize: 18, color: 'warning.main', mt: 0.1 }} />
                    <Box>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'warning.dark' }}>
                        Pendiente de publicación
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
                        El monto se confirma cuando se publiquen los valores del{' '}
                        {activeLease.adjustmentIndex} para {nextAdj.pendingPeriods.join(', ')}.
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          ) : (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>Sin ajustes pendientes</Typography>
                <Typography variant="body2" color="text.secondary">
                  Todos los ajustes del contrato fueron aplicados.
                </Typography>
              </Box>
            </Paper>
          )}
        </Box>

        {/* Right — Summary + History */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, flex: 1, minWidth: 0 }}>
          <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider', flexShrink: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
              <CalendarTodayIcon sx={{ fontSize: 20, color: 'primary.main' }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Resumen</Typography>
            </Box>
            <InfoRow label="Alquiler actual" value={formatCurrency(currentRent)} />
            <Divider />
            <InfoRow label="Alquiler inicial" value={formatCurrency(activeLease.initialRent)} />
            <Divider />
            <InfoRow label="Variación acumulada" value={`${totalVariation >= 0 ? '+' : ''}${totalVariation.toFixed(1)}%`} />
            <Divider />
            <InfoRow label="Índice" value={activeLease.adjustmentIndex} />
            <Divider />
            <InfoRow label="Frecuencia" value={freq.toLowerCase()} />
          </Paper>

          {pastAdjs.length > 0 && (
            <Paper variant="outlined" sx={{ p: 1.5, borderColor: 'divider', flex: 1, minHeight: 0, overflow: 'auto' }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.75 }}>Historial</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                {pastAdjs.map((adj) => (
                  <Box
                    key={adj.id}
                    sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      py: 0.75, px: 1, bgcolor: '#fafafa', borderRadius: 1,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {formatDate(adj.effectiveDate)}
                      </Typography>
                      <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary' }}>
                        {formatCurrency(adj.previousRent)} → {formatCurrency(adj.maxAmount)}
                      </Typography>
                    </Box>
                    <StatusChip status={adj.status} />
                  </Box>
                ))}
              </Box>
            </Paper>
          )}
        </Box>
      </Box>
    </Box>
  );
}
