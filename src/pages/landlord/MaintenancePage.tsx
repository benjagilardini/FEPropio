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
import { maintenanceApi } from '../../api/maintenanceApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { formatDateTime } from '../../utils/formatDate';
import { getApiError } from '../../utils/getApiError';
import { maintenanceCategoryLabels } from '../../constants/labels';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceStatus } from '../../types';

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
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al cambiar el estado'));
    }
  };

  return (
    <Box>
      <PageHeader title="Reclamos de Mantenimiento" />

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
                      <TableCell>{maintenanceCategoryLabels[r.category] || r.category}</TableCell>
                      <TableCell>{r.room}</TableCell>
                      <TableCell><StatusChip status={r.status} /></TableCell>
                      <TableCell>{formatDateTime(r.createdAt)}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
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
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Descripción:</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>{r.description}</Typography>
                            {r.photos.length > 0 && (
                              <>
                                <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1 }}>Fotos:</Typography>
                                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                  {r.photos.map((p) => {
                                    const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${maintenanceApi.getPhotoUrl(leaseId!, r.id, p.index)}`;
                                    return (
                                      <Box
                                        key={p.index}
                                        component="img"
                                        crossOrigin="use-credentials"
                                        src={url}
                                        alt={p.fileName}
                                        sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1.5, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                                        onClick={() => window.open(url, '_blank')}
                                      />
                                    );
                                  })}
                                </Box>
                              </>
                            )}
                            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Historial:</Typography>
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
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
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
