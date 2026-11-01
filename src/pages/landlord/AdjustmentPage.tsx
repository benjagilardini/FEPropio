import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Chip, Divider, LinearProgress, alpha, useTheme,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useQuery } from '@tanstack/react-query';
import { useLease } from '../../hooks/useLeases';
import { useNotifyAdjustment } from '../../hooks/useAdjustments';
import { useUnit } from '../../hooks/useUnits';
import { adjustmentApi } from '../../api/adjustmentApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Unit, TimelineEntry } from '../../types';

/* ---- helpers ---- */

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

const FREQUENCY_LABEL: Record<number, string> = {
  1: 'Mensual', 2: 'Bimestral', 3: 'Trimestral',
  4: 'Cuatrimestral', 6: 'Semestral', 12: 'Anual',
};

const INDEX_DESCRIPTIONS: Record<string, string> = {
  ICL: 'Índice para Contratos de Locación, publicado por el BCRA. Combina inflación (CER) y salarios (RIPTE).',
  IPC: 'Índice de Precios al Consumidor, publicado por INDEC. Mide la variación general de precios.',
  UVA: 'Unidad de Valor Adquisitivo, publicada por el BCRA. Ajusta por inflación diaria según el CER.',
};

function formatVariation(coef: string | undefined): string {
  if (!coef) return '-';
  const pct = (parseFloat(coef) - 1) * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`;
}

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatMonthYear(isoDate: string): string {
  const d = new Date(isoDate);
  return d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

/* ---- shared sub-components ---- */

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

function MiniChart({ data }: { data: Array<{ period: string; value: number }> }) {
  const theme = useTheme();
  if (data.length < 2) return null;
  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const height = 48;
  const width = 200;
  const step = width / (data.length - 1);
  const points = data.map((d, i) => {
    const x = i * step;
    const y = height - ((d.value - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block' }}>
      <polyline points={points} fill="none" stroke={theme.palette.primary.main} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ---- Timeline ---- */

function TimelineDot({ status, isNext }: { status: string; isNext: boolean }) {
  const theme = useTheme();
  if (isNext) {
    return (
      <Box sx={{
        width: 12, height: 12, borderRadius: '50%',
        bgcolor: theme.palette.primary.main, border: `2px solid ${theme.palette.primary.dark}`,
        flexShrink: 0,
      }} />
    );
  }
  if (status === 'confirmed') {
    return <CheckCircleOutlinedIcon sx={{ fontSize: 14, color: 'success.main', flexShrink: 0 }} />;
  }
  return (
    <Box sx={{
      width: 10, height: 10, borderRadius: '50%',
      border: `2px solid ${theme.palette.grey[400]}`, flexShrink: 0,
    }} />
  );
}

function AdjustmentTimeline({ entries, nextDate, selectedIdx, onSelect }: {
  entries: TimelineEntry[]; nextDate: string | null;
  selectedIdx: number; onSelect: (i: number) => void;
}) {
  const theme = useTheme();
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {entries.map((entry, i) => {
        const isNext = nextDate !== null && entry.effectiveDate === nextDate;
        const isPast = new Date(entry.effectiveDate) <= new Date();
        const isSelected = i === selectedIdx;
        return (
          <Box
            key={entry.effectiveDate}
            onClick={() => onSelect(i)}
            sx={{
              display: 'flex', gap: 1.5, cursor: 'pointer',
              '&:hover .timeline-content': {
                bgcolor: alpha(theme.palette.primary.main, isNext ? 0.08 : 0.04),
              },
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 14 }}>
              <TimelineDot status={entry.status} isNext={isNext} />
              {i < entries.length - 1 && (
                <Box sx={{ width: 2, flex: 1, bgcolor: isPast ? 'success.light' : theme.palette.grey[300], minHeight: 24 }} />
              )}
            </Box>
            <Box
              className="timeline-content"
              sx={{
                flex: 1, pb: 1.5, minWidth: 0, px: 1, py: 0.5, borderRadius: 1.5,
                transition: 'background-color 0.15s',
                ...(isSelected && {
                  bgcolor: alpha(theme.palette.primary.main, 0.06),
                  border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                }),
                ...(isNext && !isSelected && {
                  bgcolor: alpha(theme.palette.primary.main, 0.03),
                }),
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: isNext || isSelected ? 700 : 600, color: isNext ? 'primary.main' : 'text.primary' }}>
                  {formatMonthYear(entry.effectiveDate)}
                  {isNext && ' — Próximo'}
                </Typography>
                <Chip
                  label={entry.status === 'confirmed' ? 'Confirmado' : 'Estimado'}
                  size="small"
                  color={entry.status === 'confirmed' ? 'success' : 'primary'}
                  variant="outlined"
                  sx={{ height: 20, fontSize: '0.65rem' }}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2, mt: 0.25 }}>
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  {formatCurrency(entry.previousRent)} → {entry.minAmount !== entry.maxAmount
                    ? `${formatCurrency(entry.minAmount)} – ${formatCurrency(entry.maxAmount)}`
                    : formatCurrency(entry.maxAmount)}
                </Typography>
                <Typography variant="caption" sx={{ fontWeight: 600, color: entry.variation > 0 ? 'error.main' : 'success.main' }}>
                  {formatPct(entry.variation)}
                </Typography>
              </Box>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

/* ---- Detail Panel ---- */

function AdjustmentDetail({ entry, indexName, isNext }: {
  entry: TimelineEntry; indexName: string; isNext: boolean;
}) {
  const theme = useTheme();
  const isEstimated = entry.status === 'estimated';
  const hasRange = isEstimated && entry.minAmount !== entry.maxAmount;

  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <TrendingUpIcon sx={{ fontSize: 20, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
          {isNext ? 'Próximo ajuste' : `Ajuste de ${formatMonthYear(entry.effectiveDate)}`}
        </Typography>
        <Box sx={{ ml: 'auto' }}>
          <Chip
            label={isEstimated ? 'Estimado' : 'Confirmado'}
            size="small"
            color={isEstimated ? 'primary' : 'success'}
          />
        </Box>
      </Box>

      <InfoRow label="Fecha efectiva" value={formatDate(entry.effectiveDate)} bold />
      <Divider />
      <InfoRow label="Mes de aplicación" value={formatMonthYear(entry.effectiveDate)} />
      <Divider />
      <InfoRow label="Alquiler actual" value={formatCurrency(entry.previousRent)} />
      <Divider />
      <InfoRow
        label={isEstimated ? 'Estimación nuevo alquiler' : 'Nuevo alquiler'}
        value={
          hasRange
            ? `${formatCurrency(entry.minAmount)} – ${formatCurrency(entry.maxAmount)}`
            : formatCurrency(entry.maxAmount)
        }
        bold
        color={theme.palette.primary.main}
      />
      <Divider />
      <InfoRow
        label="Variación"
        value={
          hasRange
            ? `${formatVariation(entry.minCoefficient)} a ${formatVariation(entry.maxCoefficient)}`
            : formatVariation(entry.maxCoefficient)
        }
        color={theme.palette.error.main}
      />
      {entry.startIndexValue && (
        <>
          <Divider />
          <InfoRow label={`${indexName} inicio de período`} value={parseFloat(entry.startIndexValue).toFixed(2)} />
        </>
      )}
      {entry.endIndexValue && (
        <>
          <Divider />
          <InfoRow label={`${indexName} fin de período`} value={parseFloat(entry.endIndexValue).toFixed(2)} />
        </>
      )}

      {entry.pendingPeriods.length > 0 && (
        <Box sx={{ mt: 1.5, p: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.06), borderRadius: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <InfoOutlinedIcon sx={{ fontSize: 18, color: 'primary.main', mt: 0.1 }} />
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.dark' }}>
              Pendiente de publicación
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', color: 'text.secondary', mt: 0.25 }}>
              El monto se confirmará cuando se publiquen los valores del{' '}
              {indexName} para los períodos pendientes.
            </Typography>
          </Box>
        </Box>
      )}
    </Paper>
  );
}

/* ---- Main Page ---- */

export default function AdjustmentPage() {
  const { leaseId, adjustmentId } = useParams<{ leaseId: string; adjustmentId: string }>();
  const navigate = useNavigate();
  const { data: lease } = useLease(leaseId!);
  const { data: unit } = useUnit(lease?.unitId || '');
  const notifyMut = useNotifyAdjustment();
  const toast = useToast();

  const { data: summary, isLoading } = useQuery({
    queryKey: ['adjustment-summary', leaseId],
    queryFn: () => adjustmentApi.getSummary(leaseId!),
    enabled: !!leaseId,
  });

  // Pre-select the adjustment from the URL, or default to next
  const nextIdx = summary?.timeline.findIndex((t) => new Date(t.effectiveDate) > new Date()) ?? 0;
  const urlIdx = summary?.timeline.findIndex((_, i) => {
    // Match by index in adjustments order — adjustmentId from URL maps to the timeline
    return false; // will be overridden below
  });
  const defaultIdx = (() => {
    if (!summary || !adjustmentId) return nextIdx >= 0 ? nextIdx : 0;
    // Try to match the adjustment by date or position
    // Since timeline doesn't have IDs, find by matching the adjustment from the API
    return nextIdx >= 0 ? nextIdx : 0;
  })();

  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const activeIdx = selectedIdx ?? defaultIdx;

  const unitAddress = unit ? formatAddress(unit) : '';

  const handleNotify = async () => {
    if (!adjustmentId) return;
    try {
      await notifyMut.mutateAsync({ leaseId: leaseId!, adjustmentId: adjustmentId! });
      toast.success('Notificación enviada al inquilino');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al enviar la notificación');
    }
  };

  if (isLoading) return <LoadingSpinner />;
  if (!summary) return <EmptyState message="No hay datos de ajustes disponibles." />;

  const { daysUntilNext, indexStats, timeline, contractProgress, lease: leaseData } = summary;
  const freq = FREQUENCY_LABEL[leaseData.adjustmentFrequencyMonths] || `Cada ${leaseData.adjustmentFrequencyMonths} meses`;
  const theme = useTheme();
  const nextDate = timeline[nextIdx >= 0 ? nextIdx : -1]?.effectiveDate ?? null;
  const selectedEntry = timeline[activeIdx];

  return (
    <Box>
      <PageHeader
        breadcrumbs={[
          { label: 'Actualizaciones', onClick: () => navigate('/adjustments') },
          ...(unit ? [{ label: unitAddress }] : []),
        ]}
        title="Ajustes"
        chips={
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <Chip label={leaseData.adjustmentIndex} size="small" color="primary" variant="outlined" />
            <Chip label={freq} size="small" variant="outlined" />
          </Box>
        }
        actions={
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={handleNotify}
            disabled={notifyMut.isPending}
            sx={{ textTransform: 'uppercase' }}
          >
            {notifyMut.isPending ? 'Enviando...' : `Notificar al ${lease?.tenantName ? 'locatario' : 'inquilino'}`}
          </Button>
        }
      />

      {/* Stats bar */}
      <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
        <StatCard label="Alquiler actual" value={formatCurrency(summary.currentRent)} />
        <StatCard
          label="Variación acumulada"
          value={formatPct(summary.totalVariation)}
          subtitle={`desde ${formatDate(leaseData.startDate)}`}
          color={summary.totalVariation > 0 ? theme.palette.error.main : theme.palette.success.main}
        />
        <StatCard
          label={`Promedio mensual ${leaseData.adjustmentIndex}`}
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

      {/* Master-detail: Timeline left, Detail right */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        {/* LEFT: Timeline + Contract + Index */}
        <Box sx={{ width: 380, display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
          {timeline.length > 0 && (
            <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
              <SectionTitle
                icon={<TimelineIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
                title="Cronograma de ajustes"
              />
              <AdjustmentTimeline
                entries={timeline}
                nextDate={nextDate}
                selectedIdx={activeIdx}
                onSelect={setSelectedIdx}
              />
            </Paper>
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
            <SectionTitle
              icon={<DescriptionOutlinedIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
              title="Contrato"
            />
            <InfoRow label="Alquiler inicial" value={formatCurrency(leaseData.initialRent)} />
            <Divider />
            <InfoRow label="Alquiler actual" value={formatCurrency(summary.currentRent)} bold />
            <Divider />
            <InfoRow label="Inicio" value={formatDate(leaseData.startDate)} />
            <Divider />
            <InfoRow label="Finalización" value={formatDate(leaseData.endDate)} />
            <Divider />
            <InfoRow label="Índice" value={leaseData.adjustmentIndex} />
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

        {/* RIGHT: Detail + Index */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0 }}>
          {selectedEntry && (
            <AdjustmentDetail
              entry={selectedEntry}
              indexName={leaseData.adjustmentIndex}
              isNext={selectedEntry.effectiveDate === nextDate}
            />
          )}

          <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
            <SectionTitle
              icon={<ShowChartIcon sx={{ fontSize: 20, color: 'primary.main' }} />}
              title={`Índice ${leaseData.adjustmentIndex}`}
            />
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Box sx={{ flex: 1 }}>
                <InfoRow label="Último valor disponible" value={indexStats.lastValue} bold />
                <Divider />
                <InfoRow label="Datos disponibles hasta" value={formatDate(indexStats.lastDate)} />
                <Divider />
                <InfoRow
                  label="Variación últimos 3 meses"
                  value={formatPct(indexStats.last3MonthVariation)}
                  color={indexStats.last3MonthVariation > 0 ? theme.palette.error.main : theme.palette.success.main}
                />
                <Divider />
                <InfoRow
                  label="Variación últimos 6 meses"
                  value={formatPct(indexStats.last6MonthVariation)}
                  color={indexStats.last6MonthVariation > 0 ? theme.palette.error.main : theme.palette.success.main}
                />
              </Box>
              {indexStats.trend.length >= 2 && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="caption" sx={{ color: 'text.secondary', mb: 0.5 }}>Tendencia</Typography>
                  <MiniChart data={indexStats.trend} />
                </Box>
              )}
            </Box>
            <Box sx={{ p: 1.5, bgcolor: alpha(theme.palette.info.main, 0.06), borderRadius: 1.5 }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', lineHeight: 1.5 }}>
                <strong>{leaseData.adjustmentIndex}:</strong> {INDEX_DESCRIPTIONS[leaseData.adjustmentIndex] || 'Índice de ajuste pactado en el contrato.'}
              </Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}
