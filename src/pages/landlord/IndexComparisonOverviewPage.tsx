import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem,
} from '@mui/material';
import { useUnits } from '../../hooks/useUnits';
import { useIndexComparison } from '../../hooks/useAdjustments';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPercentage } from '../../utils/formatPercentage';
import { formatDate } from '../../utils/formatDate';
import type { Unit } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function getUnitLabel(unit: Unit): string {
  const addr = formatAddress(unit);
  const tenant = unit.tenant?.name;
  return tenant ? `${addr} — ${tenant}` : addr;
}

export default function IndexComparisonOverviewPage() {
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const { data: unitsData, isLoading: unitsLoading } = useUnits();

  const units: Unit[] = (unitsData?.data || []).filter(
    (u) => u.isOccupied,
  );

  const selectedUnit = units.find((u) => u.id === selectedUnitId);
  const leaseId = '';

  const { data: comparisonData, isLoading: comparisonLoading } = useIndexComparison(leaseId);

  if (unitsLoading) return <LoadingSpinner />;

  const indices = ['IPC', 'ICL', 'UVA'] as const;

  return (
    <Box>
      {/* Header */}
      <Box mb={1}>
        <Typography variant="h5" fontWeight="bold">Comparar indices</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, maxWidth: 600 }}>
          Como habria evolucionado el alquiler con otros indices, con la misma periodicidad y fecha de inicio del contrato.
        </Typography>
      </Box>

      {/* Unit selector — only occupied units */}
      <TextField
        select
        label="Unidad"
        value={selectedUnitId}
        onChange={(e) => setSelectedUnitId(e.target.value)}
        sx={{ mt: 2, mb: 3, minWidth: 400 }}
        size="small"
      >
        {units.map((unit) => (
          <MenuItem key={unit.id} value={unit.id}>
            {getUnitLabel(unit)}
          </MenuItem>
        ))}
      </TextField>

      {/* Content */}
      {!selectedUnitId && (
        <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
          Seleccion&aacute; una unidad para comparar indices.
        </Typography>
      )}

      {selectedUnitId && comparisonLoading && <LoadingSpinner />}

      {selectedUnitId && !comparisonLoading && !comparisonData && (
        <EmptyState
          message="Sin datos de comparacion"
          description="No hay datos de comparacion de indices disponibles para este contrato."
        />
      )}

      {selectedUnitId && !comparisonLoading && comparisonData && (
        <>
          {/* Summary table */}
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
                  const d = comparisonData[idx];
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

          {/* Evolution tables per index */}
          {indices.map((idx) => {
            const d = comparisonData[idx];
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
        </>
      )}
    </Box>
  );
}
