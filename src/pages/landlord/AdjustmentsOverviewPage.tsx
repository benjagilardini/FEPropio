import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow,
} from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useQueries } from '@tanstack/react-query';
import { useUnits } from '../../hooks/useUnits';
import { leaseApi } from '../../api/leaseApi';
import { adjustmentApi } from '../../api/adjustmentApi';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import type { Unit, Lease, RentAdjustment } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function formatFreq(months: number): string {
  if (months === 3) return 'trimestral';
  if (months === 4) return 'cuatrimestral';
  if (months === 6) return 'semestral';
  if (months === 12) return 'anual';
  return `cada ${months} meses`;
}

interface AdjustmentRow {
  unit: Unit;
  lease: Lease;
  adjustment: RentAdjustment;
}

const headerCellSx = {
  fontWeight: 600,
  color: 'text.secondary',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.05em',
  fontSize: '0.75rem',
};

export default function AdjustmentsOverviewPage() {
  const navigate = useNavigate();
  const { data: unitsData, isLoading: unitsLoading } = useUnits(1);
  const units = unitsData?.data || [];
  const occupiedUnits = units.filter((u) => u.isOccupied);

  // Fetch leases for each occupied unit
  const leaseQueries = useQueries({
    queries: occupiedUnits.map((unit) => ({
      queryKey: ['leases', 'unit', unit.id, 1],
      queryFn: () => leaseApi.listByUnit(unit.id, { page: 1 }),
    })),
  });

  // Build unit -> active lease map
  const unitLeaseMap = new Map<string, Lease>();
  occupiedUnits.forEach((unit, i) => {
    const active = leaseQueries[i]?.data?.data?.find((l) => l.status === 'active');
    if (active) unitLeaseMap.set(unit.id, active);
  });
  const activeLeases = Array.from(unitLeaseMap.values());

  // Fetch adjustments for each active lease
  const adjustmentQueries = useQueries({
    queries: activeLeases.map((lease) => ({
      queryKey: ['adjustments', lease.id, 1],
      queryFn: () => adjustmentApi.list(lease.id, { page: 1 }),
    })),
  });

  // Build rows: only the next upcoming adjustment per unit + confirmed history
  const upcomingRows: AdjustmentRow[] = [];
  const appliedRows: AdjustmentRow[] = [];

  activeLeases.forEach((lease, i) => {
    const adjData = adjustmentQueries[i]?.data?.data;
    const unit = occupiedUnits.find((u) => unitLeaseMap.get(u.id)?.id === lease.id);
    if (!unit || !adjData) return;

    // Sort by date ascending to find the first non-confirmed
    const sorted = [...adjData].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));

    let nextFound = false;
    for (const adj of sorted) {
      if (adj.status === 'confirmed') {
        appliedRows.push({ unit, lease, adjustment: adj });
      } else if (!nextFound) {
        // Only take the first (nearest) upcoming adjustment per lease
        upcomingRows.push({ unit, lease, adjustment: adj });
        nextFound = true;
      }
    }
  });

  upcomingRows.sort((a, b) => a.adjustment.effectiveDate.localeCompare(b.adjustment.effectiveDate));
  appliedRows.sort((a, b) => b.adjustment.effectiveDate.localeCompare(a.adjustment.effectiveDate));

  const leasesLoading = leaseQueries.some((q) => q.isLoading);
  const adjustmentsLoading = adjustmentQueries.some((q) => q.isLoading);
  const isLoading = unitsLoading || (occupiedUnits.length > 0 && leasesLoading) || (activeLeases.length > 0 && adjustmentsLoading);

  if (unitsLoading) return <LoadingSpinner />;

  return (
    <Box>
      <PageHeader
        title="Actualizaciones"
        subtitle="Próximos ajustes de todas tus unidades, según el índice y la periodicidad de cada contrato."
      />

      {occupiedUnits.length === 0 ? (
        <EmptyState
          message="No hay ajustes próximos"
          description="Cuando tengas contratos activos con ajustes programados, aparecerán aquí."
        />
      ) : isLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* Upcoming adjustments */}
          {upcomingRows.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Próximo ajuste
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider', mb: 4 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>Unidad</TableCell>
                      <TableCell sx={headerCellSx}>Índice</TableCell>
                      <TableCell sx={headerCellSx}>Fecha</TableCell>
                      <TableCell sx={headerCellSx}>Alquiler vigente</TableCell>
                      <TableCell sx={headerCellSx}>Nuevo alquiler</TableCell>
                      <TableCell sx={headerCellSx}>Estado</TableCell>
                      <TableCell sx={{ width: 40 }} />
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {upcomingRows.map((row) => (
                      <TableRow
                        key={row.adjustment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/leases/${row.lease.id}/adjustments/${row.adjustment.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatAddress(row.unit)}
                          </Typography>
                          {row.lease.tenantName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.lease.tenantName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.lease.adjustmentIndex} · {formatFreq(row.lease.adjustmentFrequencyMonths)}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(row.adjustment.effectiveDate)}</TableCell>
                        <TableCell>{formatCurrency(row.adjustment.previousRent)}</TableCell>
                        <TableCell>
                          {row.adjustment.minAmount && row.adjustment.maxAmount
                            ? row.adjustment.minAmount === row.adjustment.maxAmount
                              ? formatCurrency(row.adjustment.maxAmount)
                              : `${formatCurrency(row.adjustment.minAmount)} – ${formatCurrency(row.adjustment.maxAmount)}`
                            : '—'}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={row.adjustment.status} />
                        </TableCell>
                        <TableCell>
                          <ChevronRightIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* Applied adjustments */}
          {appliedRows.length > 0 && (
            <>
              <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
                Ajustes aplicados
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderColor: 'divider', mb: 3 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={headerCellSx}>Unidad</TableCell>
                      <TableCell sx={headerCellSx}>Índice</TableCell>
                      <TableCell sx={headerCellSx}>Fecha</TableCell>
                      <TableCell sx={headerCellSx}>Alquiler anterior</TableCell>
                      <TableCell sx={headerCellSx}>Alquiler nuevo</TableCell>
                      <TableCell sx={headerCellSx}>Notificación</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {appliedRows.map((row) => (
                      <TableRow
                        key={row.adjustment.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate(`/leases/${row.lease.id}/adjustments/${row.adjustment.id}`)}
                      >
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {formatAddress(row.unit)}
                          </Typography>
                          {row.lease.tenantName && (
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                              {row.lease.tenantName}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {row.lease.adjustmentIndex} · {formatFreq(row.lease.adjustmentFrequencyMonths)}
                          </Typography>
                        </TableCell>
                        <TableCell>{formatDate(row.adjustment.effectiveDate)}</TableCell>
                        <TableCell>{formatCurrency(row.adjustment.previousRent)}</TableCell>
                        <TableCell>
                          {row.adjustment.maxAmount ? formatCurrency(row.adjustment.maxAmount) : '—'}
                        </TableCell>
                        <TableCell>
                          {row.adjustment.updatedAt && (
                            <StatusChip
                              status="confirmed"
                              variant="outlined"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {upcomingRows.length === 0 && appliedRows.length === 0 && (
            <EmptyState
              message="No hay ajustes registrados"
              description="Los ajustes se generarán automáticamente según el índice y la periodicidad de cada contrato."
            />
          )}

          {/* Info box */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1.5,
              p: 2,
              bgcolor: 'info.main',
              borderRadius: 1.5,
              color: 'info.contrastText',
              opacity: 0.9,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.25 }} />
            <Typography variant="body2">
              Mientras el índice no esté publicado en su totalidad, el nuevo alquiler se muestra como un rango que se reduce a medida que se difunden los datos faltantes.
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
}
