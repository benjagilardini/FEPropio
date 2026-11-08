import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, InputAdornment,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useUnits } from '../../hooks/useUnits';
import { useAnnualYield } from '../../hooks/useYield';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';

/* ---- helpers ---- */

const categoryLabels: Record<string, string> = {
  tax: 'Impuestos',
  insurance: 'Seguros',
  maintenance: 'Mantenimiento',
  condominiumFees: 'Expensas',
  other: 'Otros',
};

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

function formatUsd(value: number | null): string {
  if (value === null) return '-';
  return `USD ${value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatPct(value: number | null): string {
  if (value === null) return '-';
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function formatMonthLabel(month: string): string {
  const idx = parseInt(month.split('-')[1], 10) - 1;
  return monthNames[idx] || month;
}

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  fontSize: '0.8rem',
};

/* ---- stat card ---- */

function StatCard({
  label, value, subtitle, color,
}: {
  label: string; value: string; subtitle?: string; color?: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', textAlign: 'center' }}>
      <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
        {label}
      </Typography>
      <Typography variant="h5" sx={{ fontWeight: 700, color: color || 'text.primary', my: 0.5 }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );
}

/* ---- dollar comparison card ---- */

function DollarComparisonCard({
  label,
  beats,
  rentIncrease,
  devaluation,
  net,
}: {
  label: string;
  beats: boolean;
  rentIncrease: number;
  devaluation: number;
  net: number;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        {beats ? (
          <TrendingUpIcon sx={{ color: 'success.main' }} />
        ) : (
          <TrendingDownIcon sx={{ color: 'error.main' }} />
        )}
        <Typography sx={{ fontWeight: 600, color: beats ? 'success.main' : 'error.main' }}>
          {beats ? `Le ganó al ${label}` : `Perdió contra el ${label}`}
        </Typography>
      </Box>
      <Typography variant="body2" color="text.secondary">
        Aumento del alquiler: {formatPct(rentIncrease)}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Devaluación del peso: {formatPct(devaluation)}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 600, mt: 0.5 }}>
        Diferencia: {formatPct(net)}
      </Typography>
    </Paper>
  );
}

/* ---- component ---- */

export default function YieldOverviewPage() {
  const toast = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [customRefValue, setCustomRefValue] = useState<string>('');

  const { data: unitsData, isLoading: unitsLoading } = useUnits();
  const units = unitsData?.data || [];

  const { data, isLoading, error } = useAnnualYield(selectedUnitId, selectedYear);

  // Initialize custom ref value from data
  useEffect(() => {
    if (data?.referenceValueUsd !== null && data?.referenceValueUsd !== undefined) {
      setCustomRefValue(String(data.referenceValueUsd));
    }
  }, [data?.referenceValueUsd, selectedUnitId]);

  // Compute yields from editable price
  const refValue = parseFloat(customRefValue) || 0;
  const yieldOficial = refValue > 0 ? (data?.netIncomeUsdOficial ?? 0) / refValue * 100 : null;
  const yieldBlue = refValue > 0 ? (data?.netIncomeUsdBlue ?? 0) / refValue * 100 : null;

  // Show non-critical warnings as toasts
  const shownWarningsRef = useRef<string>('');
  useEffect(() => {
    if (!data?.warnings) return;
    const key = `${selectedUnitId}-${selectedYear}`;
    if (shownWarningsRef.current === key) return;
    shownWarningsRef.current = key;

    for (const w of data.warnings) {
      if (w.code === 'NO_CONTRACTS') continue;
      if (w.code === 'INCOMPLETE_YEAR') continue;
      toast.info(w.message);
    }
  }, [data?.warnings, selectedUnitId, selectedYear]);

  // Year options
  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 10; y--) {
      years.push(y);
    }
    return years;
  }, [currentYear]);

  // Auto-select first unit
  if (!selectedUnitId && units.length > 0) {
    setSelectedUnitId(units[0].id);
  }

  if (unitsLoading) return <LoadingSpinner />;

  if (units.length === 0) {
    return <EmptyState message="Sin propiedades" description="Registrá una propiedad para ver el rendimiento." />;
  }

  const hasNoContracts = data?.warnings.some((w) => w.code === 'NO_CONTRACTS');

  return (
    <Box>
      <PageHeader
        title="Rendimiento"
        subtitle="Resumen anual de rentabilidad por propiedad."
      />

      {/* Selectors */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          select
          label="Propiedad"
          value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          sx={{ minWidth: 320 }}
          size="small"
        >
          {units.map((u) => (
            <MenuItem key={u.id} value={u.id}>
              {u.address.street} {u.address.number}
              {u.address.floor ? `, ${u.address.floor}.°` : ''}
              {u.address.apartment ? ` ${u.address.apartment}` : ''}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          select
          label="Año"
          value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          sx={{ minWidth: 120 }}
          size="small"
        >
          {yearOptions.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </TextField>
      </Box>

      {isLoading && <LoadingSpinner />}
      {error && <EmptyState message="Error" description="No se pudo cargar los datos de rendimiento." />}

      {data && (
        <>
          {/* Inline notice for incomplete year */}
          {data.isIncompleteYear && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Datos calculados hasta {new Date(0, parseInt(data.calculatedUpToMonth.split('-')[1], 10) - 1).toLocaleDateString('es-AR', { month: 'long' })} ({data.year}).
            </Typography>
          )}

          {hasNoContracts && (
            <EmptyState message="Sin contratos" description={`No hubo contratos activos en ${selectedYear}.`} />
          )}

          {!hasNoContracts && (
            <>
              {/* Row 1: editable property value + occupancy */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem', mb: 0.5 }}>
                    Valor de la propiedad
                  </Typography>
                  <TextField
                    value={customRefValue}
                    onChange={(e) => setCustomRefValue(e.target.value)}
                    type="number"
                    size="small"
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start">USD</InputAdornment>,
                      },
                    }}
                    sx={{ maxWidth: 200 }}
                  />
                </Paper>
                <StatCard
                  label="Meses alquilados"
                  value={`${data.occupiedMonths} de ${data.isIncompleteYear ? new Date().getMonth() + 1 : 12}`}
                />
                <StatCard
                  label="Meses vacantes"
                  value={String(data.vacantMonths)}
                  color={data.vacantMonths > 0 ? 'warning.main' : 'text.primary'}
                />
              </Box>

              {/* Row 2: income / expenses / net in ARS */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 2 }}>
                <StatCard label="Alquileres cobrados" value={formatCurrency(data.totalRentArs)} />
                <StatCard label="Gastos del propietario" value={formatCurrency(data.totalExpensesArs)} />
                <StatCard
                  label="Ganancia neta"
                  value={formatCurrency(data.netIncomeArs)}
                  color={data.netIncomeArs >= 0 ? 'success.main' : 'error.main'}
                />
              </Box>

              {/* Row 3: Net income in USD */}
              <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider', mb: 2 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                  Ganancia neta en dólares
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Dólar oficial</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: data.netIncomeUsdOficial >= 0 ? 'success.main' : 'error.main' }}>
                      {formatUsd(data.netIncomeUsdOficial)}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="body2" color="text.secondary">Dólar blue</Typography>
                    <Typography variant="h5" sx={{ fontWeight: 700, color: data.netIncomeUsdBlue >= 0 ? 'success.main' : 'error.main' }}>
                      {formatUsd(data.netIncomeUsdBlue)}
                    </Typography>
                  </Box>
                </Box>
              </Paper>

              {/* Row 4: Yield % (calculated from editable price) */}
              {yieldOficial !== null && (
                <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider', mb: 2 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                    Rentabilidad anual
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Dólar oficial</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: yieldOficial >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(Math.round(yieldOficial * 100) / 100)}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="body2" color="text.secondary">Dólar blue</Typography>
                      <Typography variant="h4" sx={{ fontWeight: 700, color: (yieldBlue ?? 0) >= 0 ? 'success.main' : 'error.main' }}>
                        {formatPct(yieldBlue !== null ? Math.round(yieldBlue * 100) / 100 : null)}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* Row 5: Dollar comparison */}
              {data.dollarComparison && (
                <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider', mb: 3 }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                    Alquiler vs. dólar
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
                    <DollarComparisonCard
                      label="dólar oficial"
                      beats={data.dollarComparison.beatsDollarOficial}
                      rentIncrease={data.dollarComparison.rentIncreasePercent}
                      devaluation={data.dollarComparison.devaluationOficialPercent}
                      net={data.dollarComparison.netVsOficialPercent}
                    />
                    <DollarComparisonCard
                      label="dólar blue"
                      beats={data.dollarComparison.beatsDollarBlue}
                      rentIncrease={data.dollarComparison.rentIncreasePercent}
                      devaluation={data.dollarComparison.devaluationBluePercent}
                      net={data.dollarComparison.netVsBluePercent}
                    />
                  </Box>
                </Paper>
              )}

              {/* Monthly detail table */}
              <Paper variant="outlined" sx={{ borderColor: 'divider', mb: 3 }}>
                <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', p: 2, pb: 0 }}>
                  Detalle mensual
                </Typography>
                <TableContainer sx={{ maxHeight: 500 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={headerCellSx}>Mes</TableCell>
                        <TableCell sx={headerCellSx} align="right">Alquiler</TableCell>
                        <TableCell sx={headerCellSx} align="right">Gastos</TableCell>
                        <TableCell sx={headerCellSx} align="right">Neto ARS</TableCell>
                        <TableCell sx={headerCellSx} align="right">USD of.</TableCell>
                        <TableCell sx={headerCellSx} align="right">USD blue</TableCell>
                        <TableCell sx={headerCellSx} align="right">Neto USD of.</TableCell>
                        <TableCell sx={headerCellSx} align="right">Neto USD blue</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.monthlyRent.map((m) => (
                        <TableRow key={m.month}>
                          <TableCell>
                            {formatMonthLabel(m.month)}
                            {m.daysOccupied < m.totalDays && m.daysOccupied > 0 && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                ({m.daysOccupied}d)
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell align="right">{formatCurrency(m.rentArs)}</TableCell>
                          <TableCell align="right">{formatCurrency(m.expensesArs)}</TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" sx={{ color: m.netArs >= 0 ? 'text.primary' : 'error.main' }}>
                              {formatCurrency(m.netArs)}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {m.avgDolarOficialVenta !== null ? `$ ${m.avgDolarOficialVenta.toFixed(0)}` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {m.avgDolarBlueVenta !== null ? `$ ${m.avgDolarBlueVenta.toFixed(0)}` : '-'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">{m.netUsdOficial !== null ? formatUsd(m.netUsdOficial) : '-'}</TableCell>
                          <TableCell align="right">{m.netUsdBlue !== null ? formatUsd(m.netUsdBlue) : '-'}</TableCell>
                        </TableRow>
                      ))}
                      {/* Total row */}
                      <TableRow sx={{ '& td': { fontWeight: 700, borderTop: 2, borderColor: 'divider' } }}>
                        <TableCell>Total</TableCell>
                        <TableCell align="right">{formatCurrency(data.totalRentArs)}</TableCell>
                        <TableCell align="right">{formatCurrency(data.totalExpensesArs)}</TableCell>
                        <TableCell align="right">
                          <Typography variant="body2" sx={{ fontWeight: 700, color: data.netIncomeArs >= 0 ? 'text.primary' : 'error.main' }}>
                            {formatCurrency(data.netIncomeArs)}
                          </Typography>
                        </TableCell>
                        <TableCell />
                        <TableCell />
                        <TableCell align="right">{formatUsd(data.netIncomeUsdOficial)}</TableCell>
                        <TableCell align="right">{formatUsd(data.netIncomeUsdBlue)}</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {/* Expenses by category */}
              {data.expensesByCategory.length > 0 && (
                <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
                  <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                    Gastos por categoría
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      {data.expensesByCategory.map((c) => (
                        <TableRow key={c.category} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                          <TableCell>{categoryLabels[c.category] || c.category}</TableCell>
                          <TableCell align="right">{formatCurrency(c.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Paper>
              )}
            </>
          )}
        </>
      )}
    </Box>
  );
}
