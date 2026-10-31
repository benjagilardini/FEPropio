import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Chip, Collapse, List, ListItem, ListItemText,
  Button, Pagination as MuiPagination,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTenantLeases } from '../../hooks/useLeases';
import { useAdjustments } from '../../hooks/useAdjustments';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { formatPercentage } from '../../utils/formatPercentage';

export default function AdjustmentsPage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<string | null>(null);
  const { data, isLoading } = useAdjustments(activeLease?.id || '', page);

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenes un contrato activo." />;

  const adjustments = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  if (adjustments.length === 0) return <EmptyState message="No hay ajustes generados." />;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Ajustes de Alquiler</Typography>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Fecha</TableCell>
              <TableCell>Alquiler anterior</TableCell>
              <TableCell>Nuevo alquiler</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {adjustments.map((adj) => (
              <>
                <TableRow key={adj.id}>
                  <TableCell>{formatDate(adj.effectiveDate)}</TableCell>
                  <TableCell>{formatCurrency(adj.previousRent)}</TableCell>
                  <TableCell>
                    {adj.status === 'estimated'
                      ? `${formatCurrency(adj.minAmount)} - ${formatCurrency(adj.maxAmount)}`
                      : formatCurrency(adj.maxAmount)
                    }
                  </TableCell>
                  <TableCell><StatusChip status={adj.status} /></TableCell>
                  <TableCell>
                    <Button size="small" onClick={() => setExpanded(expanded === adj.id ? null : adj.id)}>
                      {expanded === adj.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </Button>
                  </TableCell>
                </TableRow>
                <TableRow key={`${adj.id}-detail`}>
                  <TableCell colSpan={5} sx={{ py: 0 }}>
                    <Collapse in={expanded === adj.id}>
                      <Box sx={{ py: 2 }}>
                        <List dense>
                          {adj.startIndexValue && <ListItem><ListItemText primary="Indice inicio" secondary={adj.startIndexValue} /></ListItem>}
                          {adj.endIndexValue && <ListItem><ListItemText primary="Indice fin" secondary={adj.endIndexValue} /></ListItem>}
                          <ListItem>
                            <ListItemText
                              primary="Coeficiente"
                              secondary={adj.status === 'estimated'
                                ? `${formatPercentage(adj.minCoefficient)} - ${formatPercentage(adj.maxCoefficient)}`
                                : formatPercentage(adj.maxCoefficient)
                              }
                            />
                          </ListItem>
                        </List>
                        {adj.pendingPeriods.length > 0 && (
                          <Box mt={1}>
                            <Typography variant="body2" color="text.secondary">Periodos pendientes:</Typography>
                            <Box display="flex" gap={0.5} flexWrap="wrap" mt={0.5}>
                              {adj.pendingPeriods.map((p) => (
                                <Chip key={p} label={p} size="small" color="warning" variant="outlined" />
                              ))}
                            </Box>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={2}>
          <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
    </Box>
  );
}
