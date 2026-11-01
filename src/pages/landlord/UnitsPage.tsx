import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Pagination as MuiPagination, alpha,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import { useUnits } from '../../hooks/useUnits';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { formatCurrency } from '../../utils/formatCurrency';
import type { Unit } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

function formatAddressSecondary(unit: Unit): string | null {
  const parts: string[] = [];
  if (unit.address.neighborhood) parts.push(unit.address.neighborhood);
  if (unit.functionalUnit) parts.push(`UF ${unit.functionalUnit}`);
  return parts.length > 0 ? parts.join(' · ') : null;
}

const statCards = [
  { key: 'total', label: 'Total unidades', icon: HomeWorkIcon, color: '#1565c0' },
  { key: 'occupied', label: 'Ocupadas', icon: CheckCircleOutlineIcon, color: '#2e7d32' },
  { key: 'vacant', label: 'Vacantes', icon: MeetingRoomIcon, color: '#ed6c02' },
] as const;

export default function UnitsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useUnits(page);

  if (isLoading) return <LoadingSpinner />;

  const units = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const total = units.length;
  const occupied = units.filter((u) => u.isOccupied).length;
  const vacant = total - occupied;
  const counts = { total, occupied, vacant } as const;

  return (
    <Box>
      <PageHeader
        title="Mis unidades"
        subtitle="Gestioná tus propiedades y contratos de alquiler."
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/units/new')}>
            Nueva unidad
          </Button>
        }
      />

      {units.length === 0 ? (
        <EmptyState
          message="No tenés unidades cargadas"
          description="Crea tu primera unidad para comenzar a gestionar tus alquileres."
          action={
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/units/new')}>
              Crear mi primera unidad
            </Button>
          }
        />
      ) : (
        <>
          {/* Stat cards */}
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 3 }}>
            {statCards.map(({ key, label, icon: Icon, color }) => (
              <Paper
                key={key}
                variant="outlined"
                sx={{
                  p: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  borderColor: 'divider',
                }}
              >
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: alpha(color, 0.08),
                    flexShrink: 0,
                  }}
                >
                  <Icon sx={{ color, fontSize: 24 }} />
                </Box>
                <Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500, lineHeight: 1.2 }}>
                    {label}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                    {counts[key]}
                  </Typography>
                </Box>
              </Paper>
            ))}
          </Box>

          {/* Units table */}
          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{ borderColor: 'divider' }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Unidad
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Estado
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Locatario
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Alquiler vigente
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary', fontWeight: 600, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Próximo ajuste
                  </TableCell>
                  <TableCell sx={{ width: 48 }} />
                </TableRow>
              </TableHead>
              <TableBody>
                {units.map((unit) => {
                  const isOccupied = unit.isOccupied;
                  const secondary = formatAddressSecondary(unit);

                  return (
                    <TableRow
                      key={unit.id}
                      hover
                      onClick={() => navigate(`/units/${unit.id}`)}
                      sx={{
                        cursor: 'pointer',
                        '&:last-child td': { borderBottom: 0 },
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatAddress(unit)}
                        </Typography>
                        {secondary && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
                            {secondary}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusChip status={isOccupied ? 'occupied' : 'vacant'} />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: isOccupied && unit.tenant?.name ? 'text.primary' : 'text.disabled' }}>
                          {isOccupied && unit.tenant?.name ? unit.tenant.name : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: isOccupied && unit.currentRent ? 500 : 400, color: isOccupied && unit.currentRent ? 'text.primary' : 'text.disabled' }}>
                          {isOccupied && unit.currentRent ? formatCurrency(unit.currentRent) : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: 'text.disabled' }}>
                          {'—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" sx={{ color: 'text.secondary' }}>
                          <ChevronRightIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <MuiPagination
                count={totalPages}
                page={page}
                onChange={(_, p) => setPage(p)}
                shape="rounded"
              />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
