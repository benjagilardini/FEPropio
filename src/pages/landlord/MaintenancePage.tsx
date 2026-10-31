import { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Pagination as MuiPagination,
  Collapse, List, ListItem, ListItemText,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useMaintenanceRequests, useUpdateMaintenanceStatus } from '../../hooks/useMaintenance';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatDateTime } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceStatus } from '../../types';

const categoryLabels: Record<string, string> = {
  plumbing: 'Plomeria',
  electrical: 'Electricidad',
  gas: 'Gas',
  structural: 'Estructura',
  appliance: 'Electrodomestico',
  other: 'Otro',
};

const statusOptions: { value: MaintenanceStatus; label: string }[] = [
  { value: 'inProgress', label: 'En progreso' },
  { value: 'resolved', label: 'Resuelto' },
  { value: 'closed', label: 'Cerrado' },
];

export default function MaintenancePage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaintenanceRequests(leaseId!, page);
  const updateStatusMut = useUpdateMaintenanceStatus();

  const toast = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [statusDialog, setStatusDialog] = useState<string | null>(null);
  const { register, handleSubmit, control, reset } = useForm<{ status: MaintenanceStatus; comment: string }>();

  if (isLoading) return <LoadingSpinner />;

  const requests = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const onSubmit = async (formData: { status: MaintenanceStatus; comment: string }) => {
    if (!statusDialog) return;
    try {
      await updateStatusMut.mutateAsync({
        leaseId: leaseId!, requestId: statusDialog,
        data: { status: formData.status, comment: formData.comment || undefined },
      });
      toast.success('Estado del reclamo actualizado');
      setStatusDialog(null);
      reset();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al cambiar el estado');
    }
  };

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 3 }}>Reclamos de Mantenimiento</Typography>

      {requests.length === 0 ? (
        <EmptyState message="No hay reclamos de mantenimiento." />
      ) : (
        <>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Código</TableCell>
                  <TableCell>Categoria</TableCell>
                  <TableCell>Ambiente</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell>Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((r) => (
                  <>
                    <TableRow key={r.id}>
                      <TableCell>{r.code}</TableCell>
                      <TableCell>{categoryLabels[r.category] || r.category}</TableCell>
                      <TableCell>{r.room}</TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <Box display="flex" gap={1}>
                          <Button size="small" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                            {expanded === r.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                          </Button>
                          {r.status !== 'closed' && (
                            <Button size="small" variant="outlined" onClick={() => setStatusDialog(r.id)}>
                              Cambiar estado
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${r.id}-detail`}>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={expanded === r.id}>
                          <Box sx={{ py: 2 }}>
                            <Typography variant="body2" fontWeight="bold">Descripcion:</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>{r.description}</Typography>
                            <Typography variant="body2" fontWeight="bold">Historial:</Typography>
                            <List dense>
                              {r.statusHistory.map((h, i) => (
                                <ListItem key={i}>
                                  <ListItemText
                                    primary={<><StatusChip status={h.status} /> {formatDateTime(h.changedAt)}</>}
                                    secondary={h.comment}
                                  />
                                </ListItem>
                              ))}
                            </List>
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
                  {statusOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
            <TextField label="Comentario (opcional)" multiline rows={2} {...register('comment')} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setStatusDialog(null)}>Cancelar</Button>
            <Button type="submit" variant="contained">Guardar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
