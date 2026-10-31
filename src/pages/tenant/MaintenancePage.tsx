import { useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Alert, Collapse, List,
  ListItem, ListItemText, Pagination as MuiPagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { useTenantLeases } from '../../hooks/useLeases';
import { useMaintenanceRequests, useCreateMaintenanceRequest } from '../../hooks/useMaintenance';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import { formatDateTime } from '../../utils/formatDate';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceInput } from '../../types';

const categoryOptions = [
  { value: 'plumbing', label: 'Plomeria' },
  { value: 'electrical', label: 'Electricidad' },
  { value: 'gas', label: 'Gas' },
  { value: 'structural', label: 'Estructura' },
  { value: 'appliance', label: 'Electrodomestico' },
  { value: 'other', label: 'Otro' },
];

const categoryLabels: Record<string, string> = Object.fromEntries(categoryOptions.map((o) => [o.value, o.label]));

export default function TenantMaintenancePage() {
  const { data: leases, isLoading: leasesLoading } = useTenantLeases();
  const activeLease = leases?.find((l) => l.status === 'active') || leases?.[0];
  const [page, setPage] = useState(1);
  const { data, isLoading } = useMaintenanceRequests(activeLease?.id || '', page);
  const createMut = useCreateMaintenanceRequest();
  const toast = useToast();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, control, reset } = useForm<MaintenanceInput>({
    defaultValues: { category: 'other' },
  });

  if (leasesLoading || isLoading) return <LoadingSpinner />;
  if (!activeLease) return <EmptyState message="No tenés un contrato activo." />;

  const requests = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  const onSubmit = async (formData: MaintenanceInput) => {
    try {
      setError('');
      await createMut.mutateAsync({ leaseId: activeLease.id, data: formData });
      toast.success('Reclamo enviado correctamente');
      setDialogOpen(false);
      reset();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al crear reclamo';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Reclamos</Typography>
        {activeLease.status === 'active' && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
            Nuevo Reclamo
          </Button>
        )}
      </Box>

      {requests.length === 0 ? (
        <EmptyState message="No hay reclamos." />
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
                  <TableCell></TableCell>
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
                        <Button size="small" onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                          {expanded === r.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </Button>
                      </TableCell>
                    </TableRow>
                    <TableRow key={`${r.id}-detail`}>
                      <TableCell colSpan={6} sx={{ py: 0 }}>
                        <Collapse in={expanded === r.id}>
                          <Box sx={{ py: 2 }}>
                            <Typography variant="body2" fontWeight="bold">Descripcion:</Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>{r.description}</Typography>
                            {r.statusHistory.length > 0 && (
                              <>
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
                              </>
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
        </>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nuevo Reclamo</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField select label="Categoria" {...field}>
                  {categoryOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
            <TextField label="Ambiente" {...register('room', { required: true })} placeholder="Ej: Cocina, Bano, Dormitorio" />
            <TextField
              label="Descripcion" multiline rows={4}
              {...register('description', { required: true, minLength: 10 })}
              helperText="Minimo 10 caracteres"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMut.isPending}>Enviar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
