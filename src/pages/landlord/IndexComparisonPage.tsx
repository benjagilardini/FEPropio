import { useParams } from 'react-router-dom';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { useIndexComparison } from '../../hooks/useAdjustments';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPercentage } from '../../utils/formatPercentage';
import { formatDate } from '../../utils/formatDate';

export default function IndexComparisonPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const { data, isLoading } = useIndexComparison(leaseId!);

  if (isLoading || !data) return <LoadingSpinner />;

  const indices = ['IPC', 'ICL', 'UVA'] as const;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Comparacion de Indices</Typography>

      <TableContainer component={Paper} sx={{ mb: 3 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Indice</TableCell>
              <TableCell align="right">Alquiler actual</TableCell>
              <TableCell align="right">Variacion total</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {indices.map((idx) => {
              const d = data[idx];
              if (!d) return null;
              return (
                <TableRow key={idx}>
                  <TableCell><strong>{idx}</strong></TableCell>
                  <TableCell align="right">{formatCurrency(d.currentRent)}</TableCell>
                  <TableCell align="right">{formatPercentage(d.totalVariation)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {indices.map((idx) => {
        const d = data[idx];
        if (!d || !d.history?.length) return null;
        return (
          <Paper key={idx} sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>Evolucion {idx}</Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Fecha</TableCell>
                    <TableCell align="right">Alquiler</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {d.history.map((h) => (
                    <TableRow key={h.date}>
                      <TableCell>{formatDate(h.date)}</TableCell>
                      <TableCell align="right">{formatCurrency(h.rent)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        );
      })}
    </Box>
  );
}
