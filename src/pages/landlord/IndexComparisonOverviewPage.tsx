import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend,
} from 'recharts';
import { useUnits } from '../../hooks/useUnits';
import { useLeasesByUnit } from '../../hooks/useLeases';
import { useIndexComparison } from '../../hooks/useAdjustments';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Unit, Lease, AdjustmentIndex } from '../../types';

/* ---- helpers ---- */

function fmtAddress(unit: Unit): string {
  const a = unit.address;
  let s = `${a.street} ${a.number}`;
  if (a.floor) s += `, ${a.floor}.°`;
  if (a.apartment) s += ` ${a.apartment}`;
  return s;
}

function fmtFreq(months: number): string {
  if (months === 3) return 'trimestral';
  if (months === 4) return 'cuatrimestral';
  if (months === 6) return 'semestral';
  if (months === 12) return 'anual';
  return `cada ${months} meses`;
}

function fmtFreqCapitalized(months: number): string {
  const s = fmtFreq(months);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function fmtShortMonth(iso: string): string {
  const d = new Date(iso);
  const name = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' });
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function fmtYAxisValue(value: number): string {
  if (value >= 1_000_000) return `$ ${(value / 1_000_000).toFixed(1)} M`;
  if (value >= 1_000) return `$ ${Math.round(value / 1_000)} mil`;
  return `$ ${value}`;
}

const INDEX_COLORS: Record<string, string> = {
  IPC: '#1565c0',
  ICL: '#90caf9',
  UVA: '#9e9e9e',
};

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  fontSize: '0.8rem',
};

/* ---- component ---- */

export default function IndexComparisonOverviewPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedLeaseId, setSelectedLeaseId] = useState<string>('');
  const { data: unitsData, isLoading: unitsLoading } = useUnits();
  const { data: leasesData } = useLeasesByUnit(selectedUnitId);
  const { data: comparisonData, isLoading: comparisonLoading } = useIndexComparison(selectedLeaseId);

  const units: Unit[] = useMemo(
    () => (unitsData?.data || []).filter((u) => u.isOccupied),
    [unitsData],
  );

  const leases: Lease[] = useMemo(
    () => (leasesData?.data || []).filter((l) => l.status === 'active' || l.status === 'ended'),
    [leasesData],
  );

  // Auto-select first occupied unit
  useEffect(() => {
    if (!selectedUnitId && units.length > 0) {
      setSelectedUnitId(units[0].id);
    }
  }, [units, selectedUnitId]);

  // Auto-select active lease when unit changes
  useEffect(() => {
    if (leases.length > 0) {
      const active = leases.find((l) => l.status === 'active');
      setSelectedLeaseId(active?.id || leases[0].id);
    } else {
      setSelectedLeaseId('');
    }
  }, [leases]);

  const selectedLease = leases.find((l) => l.id === selectedLeaseId);

  // Build chart data: merge all 3 indices' histories into a unified timeline
  const chartData = useMemo(() => {
    if (!comparisonData) return [];

    const indices: AdjustmentIndex[] = ['IPC', 'ICL', 'UVA'];
    const dateMap = new Map<string, Record<string, number>>();

    for (const idx of indices) {
      const evolution = comparisonData[idx];
      if (!evolution?.history) continue;
      for (const point of evolution.history) {
        const dateKey = point.date.split('T')[0];
        if (!dateMap.has(dateKey)) dateMap.set(dateKey, {});
        dateMap.get(dateKey)![idx] = parseFloat(point.rent);
      }
    }

    // Sort by date and forward-fill missing values
    const sorted = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, values]) => ({ date, ...values }));

    // Forward-fill so lines are continuous
    const prev: Record<string, number> = {};
    for (const row of sorted) {
      for (const idx of indices) {
        if (row[idx] != null) {
          prev[idx] = row[idx] as number;
        } else if (prev[idx] != null) {
          (row as any)[idx] = prev[idx];
        }
      }
    }

    return sorted;
  }, [comparisonData]);

  if (unitsLoading) return <LoadingSpinner />;

  const contractedIndex = comparisonData?.contractedIndex;
  const freqMonths = comparisonData?.frequencyMonths;

  // Calculate differences vs contracted index
  const getDifference = (idx: AdjustmentIndex) => {
    if (!comparisonData || !contractedIndex || idx === contractedIndex) return null;
    const contracted = comparisonData[contractedIndex];
    const current = comparisonData[idx];
    if (!contracted || !current) return null;
    const diff = parseFloat(current.totalCollected) - parseFloat(contracted.totalCollected);
    const pct = parseFloat(contracted.totalCollected) > 0
      ? (diff / parseFloat(contracted.totalCollected)) * 100
      : 0;
    return { amount: diff, percentage: pct };
  };

  return (
    <Box>
      <PageHeader
        title="Comparar índices"
        subtitle="Cómo habría evolucionado el alquiler con otros índices, con la misma periodicidad y fecha de inicio del contrato."
      />

      {/* Selectors */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 3 }}>
        <TextField
          select
          label="Unidad"
          value={selectedUnitId}
          onChange={(e) => {
            setSelectedUnitId(e.target.value);
            setSelectedLeaseId('');
          }}
          size="small"
        >
          {units.map((unit) => (
            <MenuItem key={unit.id} value={unit.id}>
              {fmtAddress(unit)}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Período"
          value={selectedLeaseId}
          onChange={(e) => setSelectedLeaseId(e.target.value)}
          size="small"
          disabled={leases.length === 0}
        >
          {leases.map((lease) => (
            <MenuItem key={lease.id} value={lease.id}>
              {lease.status === 'active'
              ? `Contrato vigente (desde ${formatDate(lease.startDate)})`
              : `Contrato finalizado (${formatDate(lease.startDate)} — ${formatDate(lease.endDate)})`}
            </MenuItem>
          ))}
        </TextField>
      </Box>

      {/* States */}
      {!selectedUnitId && (
        <Typography variant="body1" color="text.secondary">
          Seleccioná una unidad para comparar índices.
        </Typography>
      )}

      {selectedUnitId && !selectedLeaseId && !comparisonLoading && (
        <EmptyState
          message="Sin contrato"
          description="No hay contratos activos o finalizados para esta unidad."
        />
      )}

      {selectedLeaseId && comparisonLoading && <LoadingSpinner />}

      {selectedLeaseId && !comparisonLoading && !comparisonData && (
        <EmptyState
          message="Sin datos de comparación"
          description="No hay datos de índices disponibles para este contrato."
        />
      )}

      {/* Chart + Table */}
      {comparisonData && (
        <>
          {/* Chart */}
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider', mb: 3 }}>
            <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
              Evolución del alquiler
            </Typography>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="date"
                  tickFormatter={fmtShortMonth}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={fmtYAxisValue}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatCurrency(value),
                    `${name}${name === contractedIndex ? ' (pactado)' : ''}`,
                  ]}
                  labelFormatter={(label: string) => formatDate(label)}
                />
                <Legend
                  formatter={(value: string) =>
                    value === contractedIndex ? `${value} (pactado)` : value
                  }
                />
                {(['IPC', 'ICL', 'UVA'] as const).map((idx) => (
                  <Line
                    key={idx}
                    type="stepAfter"
                    dataKey={idx}
                    stroke={INDEX_COLORS[idx]}
                    strokeWidth={idx === contractedIndex ? 2.5 : 1.5}
                    dot={{ r: 3, fill: INDEX_COLORS[idx], stroke: '#fff', strokeWidth: 1.5 }}
                    activeDot={{ r: 5 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </Paper>

          {/* Comparison table */}
          <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider' }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={headerCellSx}>Índice</TableCell>
                  <TableCell sx={headerCellSx}>Alquiler resultante hoy</TableCell>
                  <TableCell sx={headerCellSx}>Total cobrado en el período</TableCell>
                  <TableCell sx={headerCellSx}>Diferencia con el pactado</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(['IPC', 'ICL', 'UVA'] as const).map((idx) => {
                  const evolution = comparisonData[idx];
                  if (!evolution) return null;
                  const isContracted = idx === contractedIndex;
                  const diff = getDifference(idx);

                  return (
                    <TableRow key={idx} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>{idx}</Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                          {isContracted ? 'Pactado · ' : ''}
                          {freqMonths ? fmtFreqCapitalized(freqMonths) : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatCurrency(evolution.currentRent)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{formatCurrency(evolution.totalCollected)}</Typography>
                      </TableCell>
                      <TableCell>
                        {isContracted ? (
                          <Chip
                            label="Pactado"
                            size="small"
                            variant="outlined"
                            sx={{ fontWeight: 500 }}
                          />
                        ) : diff ? (
                          <Typography
                            variant="body2"
                            sx={{ color: diff.amount >= 0 ? 'success.main' : 'error.main' }}
                          >
                            {diff.amount >= 0 ? '+ ' : '− '}
                            {formatCurrency(Math.abs(diff.amount))}
                            {' '}
                            ({diff.amount >= 0 ? '+' : '−'} {Math.abs(diff.percentage).toFixed(1)} %)
                          </Typography>
                        ) : (
                          <Typography variant="body2" sx={{ color: 'text.secondary' }}>—</Typography>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}
    </Box>
  );
}
