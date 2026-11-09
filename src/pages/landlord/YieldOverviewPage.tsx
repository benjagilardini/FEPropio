import { useState, useMemo, useEffect, useRef } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, InputAdornment, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Divider,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import { useUnits } from '../../hooks/useUnits';
import { useAnnualYield } from '../../hooks/useYield';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';

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

function Row({ label, value, color, bold }: { label: string; value: string; color?: string; bold?: boolean }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.5 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500, color: color || 'text.primary' }}>
        {value}
      </Typography>
    </Box>
  );
}

export default function YieldOverviewPage() {
  const toast = useToast();
  const currentYear = new Date().getFullYear();

  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [customRefValue, setCustomRefValue] = useState<string>('');

  // Committed values only update on "Calcular" click to avoid triggering queries on every keystroke
  const [committedUnitId, setCommittedUnitId] = useState<string>('');
  const [committedYear, setCommittedYear] = useState<number>(currentYear);
  const [committedRefValue, setCommittedRefValue] = useState<string>('');

  const { data: unitsData, isLoading: unitsLoading } = useUnits();
  const units = unitsData?.data || [];

  const { data, isLoading, error } = useAnnualYield(committedUnitId, committedYear);

  const initialized = useRef(false);
  if (!initialized.current && units.length > 0 && !selectedUnitId) {
    initialized.current = true;
    setSelectedUnitId(units[0].id);
    setCommittedUnitId(units[0].id);
    setCommittedYear(currentYear);
  }

  useEffect(() => {
    if (data?.referenceValueUsd !== null && data?.referenceValueUsd !== undefined) {
      const val = String(data.referenceValueUsd);
      setCustomRefValue(val);
      setCommittedRefValue(val);
    }
  }, [data?.referenceValueUsd, committedUnitId]);

  const isDirty = selectedUnitId !== committedUnitId || selectedYear !== committedYear || customRefValue !== committedRefValue;

  const handleCalculate = () => {
    if (!selectedUnitId) return;
    setCommittedUnitId(selectedUnitId);
    setCommittedYear(selectedYear);
    setCommittedRefValue(customRefValue);
  };

  const refValue = parseFloat(committedRefValue) || 0;
  const yieldOficial = refValue > 0 ? (data?.netIncomeUsdOficial ?? 0) / refValue * 100 : null;
  const yieldBlue = refValue > 0 ? (data?.netIncomeUsdBlue ?? 0) / refValue * 100 : null;

  const shownWarningsRef = useRef<string>('');
  useEffect(() => {
    if (!data?.warnings) return;
    const key = `${committedUnitId}-${committedYear}`;
    if (shownWarningsRef.current === key) return;
    shownWarningsRef.current = key;
    for (const w of data.warnings) {
      if (w.code === 'NO_CONTRACTS' || w.code === 'INCOMPLETE_YEAR') continue;
      toast.info(w.message);
    }
  }, [data?.warnings, committedUnitId, committedYear]);

  const yearOptions = useMemo(() => {
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 10; y--) years.push(y);
    return years;
  }, [currentYear]);

  if (unitsLoading) return <LoadingSpinner />;
  if (units.length === 0) return <EmptyState message="Sin propiedades" description="Registrá una propiedad para ver el rendimiento." />;

  const hasNoContracts = data?.warnings.some((w) => w.code === 'NO_CONTRACTS');
  const totalMonths = data ? (data.isIncompleteYear ? new Date().getMonth() + 1 : 12) : 12;

  return (
    <Box>
      <PageHeader title="Rendimiento" subtitle="Resumen anual de rentabilidad por propiedad." />

      <Paper
        variant="outlined"
        sx={{
          display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
          p: 2, mb: 3, borderColor: 'divider', bgcolor: 'grey.50',
        }}
      >
        <TextField
          select label="Propiedad" value={selectedUnitId}
          onChange={(e) => setSelectedUnitId(e.target.value)}
          sx={{ minWidth: 280, flex: 1 }} size="small"
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
          select label="Año" value={selectedYear}
          onChange={(e) => setSelectedYear(Number(e.target.value))}
          sx={{ minWidth: 100 }} size="small"
        >
          {yearOptions.map((y) => <MenuItem key={y} value={y}>{y}</MenuItem>)}
        </TextField>
        <TextField
          label="Valor propiedad"
          value={customRefValue}
          onChange={(e) => setCustomRefValue(e.target.value)}
          type="number"
          size="small"
          slotProps={{
            input: {
              startAdornment: <InputAdornment position="start">USD</InputAdornment>,
            },
          }}
          sx={{ minWidth: 160 }}
        />
        <Button
          variant="contained"
          startIcon={<SearchIcon />}
          disabled={isLoading || !selectedUnitId || !isDirty}
          onClick={handleCalculate}
          sx={{ height: 40, textTransform: 'none', fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Calcular
        </Button>
      </Paper>

      {isLoading && <LoadingSpinner />}
      {error && <EmptyState message="Error" description="No se pudo cargar los datos de rendimiento." />}

      {data && (
        <>
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
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2, mb: 2 }}>
                <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Resumen en pesos</Typography>
                  <Row label="Alquileres cobrados" value={formatCurrency(data.totalRentArs)} />
                  <Row label="Gastos del propietario" value={formatCurrency(data.totalExpensesArs)} />
                  <Divider sx={{ my: 1 }} />
                  <Row
                    label="Ganancia neta"
                    value={formatCurrency(data.netIncomeArs)}
                    color={data.netIncomeArs >= 0 ? 'success.main' : 'error.main'}
                    bold
                  />
                  <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>Ocupación:</Typography>
                    <Typography variant="caption" sx={{ fontWeight: 600 }}>
                      {data.occupiedMonths} de {totalMonths} meses
                      {data.vacantMonths > 0 && (
                        <Typography component="span" variant="caption" sx={{ color: 'warning.main', ml: 0.5 }}>
                          ({data.vacantMonths} vacante{data.vacantMonths > 1 ? 's' : ''})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                </Paper>

                <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Resumen en dólares</Typography>
                  <Row
                    label="Ganancia neta (oficial)"
                    value={formatUsd(data.netIncomeUsdOficial)}
                    color={data.netIncomeUsdOficial >= 0 ? 'success.main' : 'error.main'}
                    bold
                  />
                  <Row
                    label="Ganancia neta (blue)"
                    value={formatUsd(data.netIncomeUsdBlue)}
                    color={data.netIncomeUsdBlue >= 0 ? 'success.main' : 'error.main'}
                    bold
                  />
                  {yieldOficial !== null && (
                    <>
                      <Divider sx={{ my: 1 }} />
                      <Row
                        label="Rentabilidad anual (oficial)"
                        value={formatPct(Math.round(yieldOficial * 100) / 100)}
                        color={yieldOficial >= 0 ? 'success.main' : 'error.main'}
                        bold
                      />
                      <Row
                        label="Rentabilidad anual (blue)"
                        value={formatPct(yieldBlue !== null ? Math.round(yieldBlue * 100) / 100 : null)}
                        color={(yieldBlue ?? 0) >= 0 ? 'success.main' : 'error.main'}
                        bold
                      />
                    </>
                  )}
                </Paper>
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: data.dollarComparison && data.ipcAdjustedVariation !== null ? '1fr 1fr 1fr' : data.dollarComparison ? '1fr 1fr' : '1fr' }, gap: 2, mb: 2 }}>
                {data.dollarComparison && (
                  <>
                    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        {data.dollarComparison.beatsDollarOficial ? (
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        )}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: data.dollarComparison.beatsDollarOficial ? 'success.main' : 'error.main' }}>
                          vs. Dólar oficial
                        </Typography>
                      </Box>
                      <Row label="Aumento alquiler" value={formatPct(data.dollarComparison.rentIncreasePercent)} />
                      <Row label="Devaluación" value={formatPct(data.dollarComparison.devaluationOficialPercent)} />
                      <Divider sx={{ my: 0.75 }} />
                      <Row label="Diferencia" value={formatPct(data.dollarComparison.netVsOficialPercent)} bold />
                    </Paper>

                    <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                        {data.dollarComparison.beatsDollarBlue ? (
                          <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                        ) : (
                          <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                        )}
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: data.dollarComparison.beatsDollarBlue ? 'success.main' : 'error.main' }}>
                          vs. Dólar blue
                        </Typography>
                      </Box>
                      <Row label="Aumento alquiler" value={formatPct(data.dollarComparison.rentIncreasePercent)} />
                      <Row label="Devaluación" value={formatPct(data.dollarComparison.devaluationBluePercent)} />
                      <Divider sx={{ my: 0.75 }} />
                      <Row label="Diferencia" value={formatPct(data.dollarComparison.netVsBluePercent)} bold />
                    </Paper>
                  </>
                )}

                {data.ipcAdjustedVariation !== null && data.inflationPercent !== null && data.rentIncreasePercent !== null && (
                  <Paper variant="outlined" sx={{ p: 2, borderColor: 'divider' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
                      {data.ipcAdjustedVariation >= 0 ? (
                        <TrendingUpIcon sx={{ color: 'success.main', fontSize: 20 }} />
                      ) : (
                        <TrendingDownIcon sx={{ color: 'error.main', fontSize: 20 }} />
                      )}
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        vs. Inflación (IPC)
                      </Typography>
                    </Box>
                    <Row label="Aumento alquiler" value={formatPct(data.rentIncreasePercent)} />
                    <Row label="Inflación (IPC)" value={formatPct(data.inflationPercent)} />
                    <Divider sx={{ my: 0.75 }} />
                    <Row
                      label="Variación real"
                      value={formatPct(data.ipcAdjustedVariation)}
                      color={data.ipcAdjustedVariation >= 0 ? 'success.main' : 'error.main'}
                      bold
                    />
                  </Paper>
                )}
              </Box>

              <Paper variant="outlined" sx={{ borderColor: 'divider', mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, p: 2, pb: 0 }}>
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

              {data.expensesByCategory.length > 0 && (
                <Paper variant="outlined" sx={{ p: 2.5, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
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
