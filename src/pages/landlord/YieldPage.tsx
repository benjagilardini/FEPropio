import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Grid, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow,
} from '@mui/material';
import { useYield } from '../../hooks/useYield';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPercentage } from '../../utils/formatPercentage';
import { formatPeriod } from '../../utils/formatDate';

const categoryLabels: Record<string, string> = {
  tax: 'Impuestos',
  insurance: 'Seguros',
  maintenance: 'Mantenimiento',
  condominiumFees: 'Expensas',
  other: 'Otros',
};

export default function YieldPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const { data, isLoading } = useYield(unitId!);

  if (isLoading || !data) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader title="Rendimiento" />

      <Grid container spacing={3} sx={{ mb: 3 }}>
        {[
          { label: 'Rendimiento bruto', value: formatPercentage(data.grossYield) },
          { label: 'Rendimiento neto', value: formatPercentage(data.netYield) },
          { label: 'Rendimiento real', value: formatPercentage(data.realYield) },
          { label: 'Inflacion (IPC)', value: formatPercentage(data.inflationRate) },
          { label: 'Meses de vacancia', value: String(data.vacancyMonths) },
        ].map((item) => (
          <Grid size={{ xs: 6, sm: 4, md: 2.4 }} key={item.label}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">{item.label}</Typography>
              <Typography variant="h6">{item.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Desglose mensual</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Período</TableCell>
                    <TableCell align="right">Ingresos</TableCell>
                    <TableCell align="right">Gastos</TableCell>
                    <TableCell align="right">Neto</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.monthlyBreakdown.map((m) => (
                    <TableRow key={m.month}>
                      <TableCell>{formatPeriod(m.month)}</TableCell>
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
                  {data.expensesByCategory.map((c) => (
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
    </Box>
  );
}
