import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TextField, MenuItem, Tabs, Tab, Button, Dialog,
  DialogTitle, DialogContent, DialogActions,
} from '@mui/material';
import { useUnits } from '../../hooks/useUnits';
import { useMaintenanceRequests, useUpdateMaintenanceStatus } from '../../hooks/useMaintenance';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatDateTime } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceStatus, Unit } from '../../types';

function formatAddress(unit: Unit): string {
  const a = unit.address;
  let addr = `${a.street} ${a.number}`;
  if (a.floor) addr += `, ${a.floor}.°`;
  if (a.apartment) addr += ` ${a.apartment}`;
  return addr;
}

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'inProgress', label: 'En progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];

const TAB_LABELS = ['Abiertos', 'Resueltos', 'Todos'] as const;

export default function MaintenanceOverviewPage() {
  const { data: unitsData, isLoading: unitsLoading } = useUnits(1);

  const occupiedUnits = (unitsData?.data || []).filter(
    (u) => u.isOccupied,
  );

  const toast = useToast();
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [tab, setTab] = useState(0);
  const [statusDialog, setStatusDialog] = useState<string | null>(null);

  const selectedUnit = occupiedUnits.find((u) => u.id === selectedUnitId);
  const leaseId = '';

  const { data: maintenanceData, isLoading: maintenanceLoading } = useMaintenanceRequests(leaseId);
  const updateStatusMut = useUpdateMaintenanceStatus();

  const { register, handleSubmit, control, reset } = useForm<{
    status: MaintenanceStatus;
    comment: string;
  }>();

  if (unitsLoading) return <LoadingSpinner />;

  const allRequests = maintenanceData?.data || [];

  const filteredRequests =
    tab === 0
      ? allRequests.filter((r) => r.status === 'open' || r.status === 'inProgress')
      : tab === 1
        ? allRequests.filter((r) => r.status === 'resolved' || r.status === 'closed')
        : allRequests;

  const onSubmit = async (formData: { status: MaintenanceStatus; comment: string }) => {
    if (!statusDialog || !leaseId) return;
    try {
      await updateStatusMut.mutateAsync({
        leaseId,
        requestId: statusDialog,
        data: { status: formData.status, comment: formData.comment || undefined },
      });
      toast.success('Estado del reclamo actualizado');
      setStatusDialog(null);
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar el estado');
    }
  };

  function truncate(text: string, maxLen = 80): string {
    if (text.length <= maxLen) return text;
    return text.slice(0, maxLen) + '…';
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
        Reclamos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Reclamos de mantenimiento registrados por tus locatarios.
      </Typography>

      {occupiedUnits.length === 0 ? (
        <EmptyState
          message="No hay unidades con contratos activos"
          description="Cuando tengas unidades ocupadas con contratos vigentes, vas a poder ver los reclamos de mantenimiento acá."
        />
      ) : (
        <>
          <TextField
            select
            label="Seleccionar unidad"
            value={selectedUnitId}
            onChange={(e) => {
              setSelectedUnitId(e.target.value);
              setTab(0);
            }}
            sx={{ mb: 3, minWidth: 350 }}
            size="small"
          >
            {occupiedUnits.map((unit) => (
              <MenuItem key={unit.id} value={unit.id}>
                {formatAddress(unit)}
                {unit.tenant?.name ? ` — ${unit.tenant.name}` : ''}
              </MenuItem>
            ))}
          </TextField>

          {selectedUnitId && (
            <>
              {maintenanceLoading ? (
                <LoadingSpinner />
              ) : allRequests.length === 0 ? (
                <EmptyState message="No hay reclamos de mantenimiento para esta unidad." />
              ) : (
                <>
                  <Tabs
                    value={tab}
                    onChange={(_, v) => setTab(v)}
                    sx={{ mb: 2 }}
                  >
                    {TAB_LABELS.map((label) => (
                      <Tab key={label} label={label} />
                    ))}
                  </Tabs>

                  {filteredRequests.length === 0 ? (
                    <EmptyState message={`No hay reclamos en "${TAB_LABELS[tab]}".`} />
                  ) : (
                    <TableContainer component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Código</TableCell>
                            <TableCell>Unidad</TableCell>
                            <TableCell>Reclamo</TableCell>
                            <TableCell>Registrado</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Acciones</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredRequests.map((r) => (
                            <TableRow key={r.id} hover>
                              <TableCell>{r.code}</TableCell>
                              <TableCell>
                                {selectedUnit ? formatAddress(selectedUnit) : '-'}
                              </TableCell>
                              <TableCell>{truncate(r.description)}</TableCell>
                              <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                              <TableCell>
                                <StatusChip status={r.status} />
                              </TableCell>
                              <TableCell>
                                {r.status !== 'closed' && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => setStatusDialog(r.id)}
                                  >
                                    Cambiar estado
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      <Dialog open={!!statusDialog} onClose={() => setStatusDialog(null)}>
        <DialogTitle>Cambiar estado del reclamo</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 300 }}>
            <Controller
              name="status"
              control={control}
              defaultValue="inProgress"
              render={({ field }) => (
                <TextField select label="Nuevo estado" {...field}>
                  {statusOptions.map((o) => (
                    <MenuItem key={o.value} value={o.value}>
                      {o.label}
                    </MenuItem>
                  ))}
                </TextField>
              )}
            />
            <TextField
              label="Comentario (opcional)"
              multiline
              rows={2}
              {...register('comment')}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(null)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
