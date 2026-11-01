import { useState, useMemo, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, MenuItem, Tabs, Tab, Button, Dialog,
  DialogTitle, DialogContent, DialogActions, Chip, Collapse, Divider,
  IconButton, alpha, useTheme,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FoundationIcon from '@mui/icons-material/Foundation';
import KitchenIcon from '@mui/icons-material/Kitchen';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import BuildIcon from '@mui/icons-material/Build';
import { useUnits } from '../../hooks/useUnits';
import { useLeasesByUnit } from '../../hooks/useLeases';
import { useMaintenanceRequests, useUpdateMaintenanceStatus } from '../../hooks/useMaintenance';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceStatus, Unit, MaintenanceRequest } from '../../types';

/* ---- helpers ---- */

function fmtAddress(unit: Unit): string {
  const a = unit.address;
  let s = `${a.street} ${a.number}`;
  if (a.floor) s += `, ${a.floor}.°`;
  if (a.apartment) s += ` ${a.apartment}`;
  return s;
}

const categoryOptions = [
  { value: 'plumbing', label: 'Plomería', icon: <PlumbingIcon sx={{ fontSize: 20 }} /> },
  { value: 'electrical', label: 'Electricidad', icon: <ElectricalServicesIcon sx={{ fontSize: 20 }} /> },
  { value: 'gas', label: 'Gas', icon: <LocalFireDepartmentIcon sx={{ fontSize: 20 }} /> },
  { value: 'structural', label: 'Estructura', icon: <FoundationIcon sx={{ fontSize: 20 }} /> },
  { value: 'appliance', label: 'Electrodoméstico', icon: <KitchenIcon sx={{ fontSize: 20 }} /> },
  { value: 'other', label: 'Otro', icon: <MoreHorizIcon sx={{ fontSize: 20 }} /> },
];
const categoryMap = Object.fromEntries(categoryOptions.map((o) => [o.value, o]));

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'inProgress', label: 'En progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];

const VALID_NEXT: Record<string, MaintenanceStatus[]> = {
  open: ['inProgress'],
  inProgress: ['resolved'],
  resolved: ['closed'],
};

/* ---- page ---- */

export default function MaintenanceOverviewPage() {
  const { data: unitsData, isLoading: unitsLoading } = useUnits(1);
  const toast = useToast();
  const theme = useTheme();

  const occupiedUnits = useMemo(
    () => (unitsData?.data || []).filter((u) => u.isOccupied),
    [unitsData],
  );

  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tab, setTab] = useState(0);
  const [statusDialog, setStatusDialog] = useState<MaintenanceRequest | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedUnitId && occupiedUnits.length > 0) setSelectedUnitId(occupiedUnits[0].id);
  }, [occupiedUnits, selectedUnitId]);

  const { data: leasesData, isLoading: leasesLoading } = useLeasesByUnit(selectedUnitId);
  const activeLease = useMemo(() => leasesData?.data?.find((l) => l.status === 'active'), [leasesData]);
  const leaseId = activeLease?.id || '';

  const { data: maintenanceData, isLoading: maintenanceLoading } = useMaintenanceRequests(leaseId);
  const updateStatusMut = useUpdateMaintenanceStatus();

  const availableStatuses = useMemo(
    () => statusDialog ? statusOptions.filter((o) => VALID_NEXT[statusDialog.status]?.includes(o.value)) : [],
    [statusDialog],
  );

  const { register, handleSubmit, control, reset } = useForm<{ status: MaintenanceStatus; comment: string }>();

  const allRequests = maintenanceData?.data || [];

  const filtered = useMemo(() => {
    if (tab === 0) return allRequests.filter((r) => r.status === 'open' || r.status === 'inProgress');
    if (tab === 1) return allRequests.filter((r) => r.status === 'resolved' || r.status === 'closed');
    return allRequests;
  }, [tab, allRequests]);

  const counts = useMemo(() => ({
    active: allRequests.filter((r) => r.status === 'open' || r.status === 'inProgress').length,
    resolved: allRequests.filter((r) => r.status === 'resolved' || r.status === 'closed').length,
  }), [allRequests]);

  if (unitsLoading) return <LoadingSpinner />;

  const loading = leasesLoading || maintenanceLoading;

  const onSubmit = async (formData: { status: MaintenanceStatus; comment: string }) => {
    if (!statusDialog || !leaseId) return;
    try {
      await updateStatusMut.mutateAsync({
        leaseId,
        requestId: statusDialog.id,
        data: { status: formData.status, comment: formData.comment || undefined },
      });
      toast.success('Estado actualizado');
      setStatusDialog(null);
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar el estado');
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <PageHeader
        title="Reclamos"
        subtitle="Reclamos de mantenimiento registrados por tus inquilinos."
      />

      {occupiedUnits.length === 0 ? (
        <EmptyState
          message="No hay unidades con contratos activos"
          description="Cuando tengas inquilinos con contratos vigentes, acá vas a poder gestionar sus reclamos."
          Icon={BuildIcon}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          {/* Controls */}
          <Box sx={{ flexShrink: 0, display: 'flex', alignItems: 'flex-end', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <TextField
              select
              label="Unidad"
              value={selectedUnitId}
              onChange={(e) => { setSelectedUnitId(e.target.value); setTab(0); setExpanded(null); }}
              size="small"
              sx={{ minWidth: 320 }}
            >
              {occupiedUnits.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {fmtAddress(u)}{u.tenant?.name ? ` — ${u.tenant.name}` : ''}
                </MenuItem>
              ))}
            </TextField>

            {selectedUnitId && !loading && activeLease && (
              <Tabs
                value={tab}
                onChange={(_, v) => { setTab(v); setExpanded(null); }}
                sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none', fontWeight: 500, fontSize: '0.85rem' } }}
              >
                <Tab label={<TabLabel text="Abiertos" count={counts.active} color="primary" />} />
                <Tab label={<TabLabel text="Resueltos" count={counts.resolved} color="success" />} />
                <Tab label="Todos" />
              </Tabs>
            )}
          </Box>

          {/* Body */}
          {!selectedUnitId ? (
            <EmptyState message="Seleccioná una unidad." />
          ) : loading ? (
            <LoadingSpinner />
          ) : !activeLease ? (
            <EmptyState message="Esta unidad no tiene un contrato activo." />
          ) : filtered.length === 0 ? (
            <EmptyState
              message={tab === 0 ? 'No hay reclamos abiertos.' : tab === 1 ? 'No hay reclamos resueltos.' : 'No hay reclamos.'}
              Icon={BuildIcon}
            />
          ) : (
            <Box sx={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
              {filtered.map((r) => {
                const isOpen = expanded === r.id;
                const cat = categoryMap[r.category] || categoryMap.other;
                const canTransition = VALID_NEXT[r.status]?.length > 0;

                return (
                  <Paper key={r.id} variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden' }}>
                    {/* Row header */}
                    <Box
                      onClick={() => setExpanded(isOpen ? null : r.id)}
                      sx={{
                        display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 1.5,
                        cursor: 'pointer', '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.02) },
                      }}
                    >
                      <Box sx={{
                        width: 38, height: 38, borderRadius: 1.5, bgcolor: alpha(theme.palette.primary.main, 0.08),
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'primary.main',
                      }}>
                        {cat.icon}
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.15 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{cat.label}</Typography>
                          <Chip label={r.code} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem', fontFamily: 'monospace' }} />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {r.room} · {formatDateTime(r.createdAt)}
                        </Typography>
                      </Box>

                      <StatusChip status={r.status} />

                      {canTransition && (
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => { e.stopPropagation(); setStatusDialog(r); reset({ status: VALID_NEXT[r.status]?.[0], comment: '' }); }}
                          sx={{ textTransform: 'none', fontSize: '0.75rem', flexShrink: 0 }}
                        >
                          {r.status === 'open' ? 'Iniciar' : r.status === 'inProgress' ? 'Resolver' : 'Cerrar'}
                        </Button>
                      )}

                      <IconButton size="small" sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', flexShrink: 0 }}>
                        <ExpandMoreIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Expanded detail */}
                    <Collapse in={isOpen}>
                      <Divider />
                      <Box sx={{ px: 2.5, py: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Descripción</Typography>
                        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25, mb: 2, whiteSpace: 'pre-wrap' }}>
                          {r.description}
                        </Typography>

                        {r.statusHistory.length > 0 && (
                          <>
                            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>Historial</Typography>
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mt: 0.5 }}>
                              {r.statusHistory.map((h, i) => (
                                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 1.5, py: 1, bgcolor: '#fafafa', borderRadius: 1.5 }}>
                                  <StatusChip status={h.status} />
                                  <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                                    {h.comment || '—'}
                                  </Typography>
                                  <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                                    {formatDateTime(h.changedAt)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          </>
                        )}
                      </Box>
                    </Collapse>
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* Status change dialog */}
      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, pb: 0.5 }}>
          Actualizar reclamo
          {statusDialog && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
              {statusDialog.code} · {categoryMap[statusDialog.category]?.label} — {statusDialog.room}
            </Typography>
          )}
        </DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField select label="Nuevo estado" {...field} size="small">
                  {availableStatuses.map((o) => (
                    <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Comentario (opcional)"
              multiline
              rows={2}
              {...register('comment')}
              size="small"
              placeholder="Ej: Se coordinó visita del plomero para el martes"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setStatusDialog(null)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={updateStatusMut.isPending}>
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

/* ---- small components ---- */

function TabLabel({ text, count, color }: { text: string; count: number; color: 'primary' | 'success' }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {text}
      {count > 0 && (
        <Chip
          label={count}
          size="small"
          color={color}
          sx={{ height: 18, minWidth: 18, fontSize: '0.7rem', '& .MuiChip-label': { px: 0.5 } }}
        />
      )}
    </Box>
  );
}
