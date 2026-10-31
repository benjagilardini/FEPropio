import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Button,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useUnits } from '../../hooks/useUnits';
import { useYield } from '../../hooks/useYield';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPercentage } from '../../utils/formatPercentage';
import { formatPeriod } from '../../utils/formatDate';
import type { Unit } from '../../types';

const categoryLabels: Record<string, string> = {
  tax: 'Impuestos',
  insurance: 'Seguros',
  maintenance: 'Mantenimiento',
  condominiumFees: 'Expensas',
  other: 'Otros',
};

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

export default function YieldOverviewPage() {
  const navigate = useNavigate();
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const { data: unitsData, isLoading: unitsLoading } = useUnits();
  const { data: yieldData, isLoading: yieldLoading } = useYield(selectedUnitId);

  if (unitsLoading) return <LoadingSpinner />;

  const units: Unit[] = unitsData?.data || [];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Rendimiento</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 600 }}>
            Calculado con los ingresos percibidos y los gastos registrados en el sistema, sobre el valor que definiste para la propiedad.
          </Typography>
        </Box>
        {selectedUnitId && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate(`/units/${selectedUnitId}/expenses`)}
          >
            Registrar gasto
          </Button>
        )}
      </Box>

      {/* Unit selector */}
      <TextField
        select
        label="Unidad"
        value={selectedUnitId}
        onChange={(e) => setSelectedUnitId(e.target.value)}
        sx={{ mt: 2, mb: 3, minWidth: 320 }}
        size="small"
      >
        {units.map((unit) => (
          <MenuItem key={unit.id} value={unit.id}>
            {formatAddress(unit)}
          </MenuItem>
        ))}
      </TextField>

      {/* Content */}
      {!selectedUnitId && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Seleccion&aacute; una unidad para ver su rendimiento.
        </Typography>
      )}

      {selectedUnitId && yieldLoading && <LoadingSpinner />}

      {selectedUnitId && !yieldLoading && !yieldData && (
        <EmptyState
          message="Sin datos de rendimiento"
          description="No hay datos de rendimiento disponibles para esta unidad."
        />
      )}

      {selectedUnitId && !yieldLoading && yieldData && (
        <>
          {/* Property value */}
          {yieldData.propertyValue != null && (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="body2" color="text.secondary">Valor de la propiedad</Typography>
              <Typography variant="h6">{formatCurrency(yieldData.propertyValue)}</Typography>
            </Paper>
          )}

          {/* Key stats */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {[
              { label: 'Ingresos percibidos', value: formatCurrency(yieldData.totalIncome) },
              { label: 'Gastos registrados', value: formatCurrency(yieldData.totalExpenses) },
              { label: 'Rendimiento bruto', value: formatPercentage(yieldData.grossYield) },
              { label: 'Rendimiento neto', value: formatPercentage(yieldData.netYield) },
              { label: 'Rendimiento real', value: formatPercentage(yieldData.realYield) },
            ].map((item) => (
              <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={item.label}>
                <Paper sx={{ p: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">{item.label}</Typography>
                  <Typography variant="h6">{item.value}</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>

          {/* Monthly breakdown + Expenses by category */}
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Desglose mensual</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Periodo</TableCell>
                        <TableCell align="right">Ingresos</TableCell>
                        <TableCell align="right">Gastos</TableCell>
                        <TableCell align="right">Neto</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {yieldData.monthlyBreakdown.map((m) => (
                        <TableRow key={m.period}>
                          <TableCell>{formatPeriod(m.period)}</TableCell>
                          <TableCell align="right">{formatCurrency(m.income)}</TableCell>
                          <TableCell align="right">{formatCurrency(m.expenses)}</TableCell>
                          <TableCell align="right">{formatCurrency(m.net)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>Gastos por categoria</Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Categoria</TableCell>
                        <TableCell align="right">Total</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {yieldData.expensesByCategory.map((c) => (
                        <TableRow key={c.category}>
                          <TableCell>{categoryLabels[c.category] || c.category}</TableCell>
                          <TableCell align="right">{formatCurrency(c.total)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Box>
  );
}
