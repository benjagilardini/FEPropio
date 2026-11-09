import { useState, useRef } from 'react';
import {
  Box, Typography, Paper, Divider, Button, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, MenuItem, Alert, Collapse,
  IconButton, Chip, Pagination as MuiPagination,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import BuildIcon from '@mui/icons-material/Build';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import CloseIcon from '@mui/icons-material/Close';
import PlumbingIcon from '@mui/icons-material/Plumbing';
import ElectricalServicesIcon from '@mui/icons-material/ElectricalServices';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import FoundationIcon from '@mui/icons-material/Foundation';
import KitchenIcon from '@mui/icons-material/Kitchen';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import { useTenantLeases } from '../../hooks/useLeases';
import { useMaintenanceRequests, useCreateMaintenanceRequest } from '../../hooks/useMaintenance';
import { maintenanceApi } from '../../api/maintenanceApi';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import StatusChip from '../../components/common/StatusChip';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/formatDate';
import { getApiError } from '../../utils/getApiError';
import { useForm, Controller } from 'react-hook-form';
import type { MaintenanceInput } from '../../types';

const categoryOptions = [
  { value: 'plumbing', label: 'Plomería', icon: <PlumbingIcon sx={{ fontSize: 20 }} /> },
  { value: 'electrical', label: 'Electricidad', icon: <ElectricalServicesIcon sx={{ fontSize: 20 }} /> },
  { value: 'gas', label: 'Gas', icon: <LocalFireDepartmentIcon sx={{ fontSize: 20 }} /> },
  { value: 'structural', label: 'Estructura', icon: <FoundationIcon sx={{ fontSize: 20 }} /> },
  { value: 'appliance', label: 'Electrodoméstico', icon: <KitchenIcon sx={{ fontSize: 20 }} /> },
  { value: 'other', label: 'Otro', icon: <MoreHorizIcon sx={{ fontSize: 20 }} /> },
];

const categoryMap = Object.fromEntries(categoryOptions.map((o) => [o.value, o]));

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
  const [photos, setPhotos] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
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
      await createMut.mutateAsync({ leaseId: activeLease.id, data: formData, photos: photos.length ? photos : undefined });
      toast.success('Reclamo enviado correctamente');
      setDialogOpen(false);
      reset();
      setPhotos([]);
    } catch (err: unknown) {
      const msg = getApiError(err, 'Error al crear reclamo');
      setError(msg);
      toast.error(msg);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setPhotos((prev) => [...prev, ...files].slice(0, 5));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildPhotoUrl = (leaseId: string, requestId: string, index: number) => {
    const base = maintenanceApi.getPhotoUrl(leaseId, requestId, index);
    return `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}${base}`;
  };

  return (
    <Box>
      <PageHeader
        title="Reclamos"
        actions={
          activeLease.status === 'active' && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Nuevo reclamo
            </Button>
          )
        }
      />

      {requests.length === 0 ? (
        <EmptyState
          message="No hay reclamos."
          description="Si tenés un problema con la vivienda, podés crear un reclamo para notificar al propietario."
          Icon={BuildIcon}
          action={
            activeLease.status === 'active' ? (
              <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)} sx={{ mt: 1 }}>
                Crear primer reclamo
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {requests.map((r) => {
            const isOpen = expanded === r.id;
            const cat = categoryMap[r.category] || categoryMap.other;

            return (
              <Paper key={r.id} variant="outlined" sx={{ borderColor: 'divider', overflow: 'hidden' }}>
                <Box
                  onClick={() => setExpanded(isOpen ? null : r.id)}
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2, px: 2.5, py: 2,
                    cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'primary.main' }}>
                    {cat.icon}
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>{cat.label}</Typography>
                      <Chip label={r.code} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      <StatusChip status={r.status} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                      {r.room} · {formatDateTime(r.createdAt)}
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                    <ExpandMoreIcon />
                  </IconButton>
                </Box>

                <Collapse in={isOpen}>
                  <Divider />
                  <Box sx={{ px: 2.5, py: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Descripción</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, whiteSpace: 'pre-wrap' }}>{r.description}</Typography>

                    {r.photos.length > 0 && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Fotos</Typography>
                        <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                          {r.photos.map((p) => (
                            <Box
                              key={p.index}
                              component="img"
                              crossOrigin="use-credentials"
                              src={buildPhotoUrl(activeLease.id, r.id, p.index)}
                              alt={p.fileName}
                              sx={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 1.5, cursor: 'pointer', border: '1px solid', borderColor: 'divider' }}
                              onClick={() => window.open(buildPhotoUrl(activeLease.id, r.id, p.index), '_blank')}
                            />
                          ))}
                        </Box>
                      </>
                    )}

                    {r.statusHistory.length > 0 && (
                      <>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Historial</Typography>
                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                          {r.statusHistory.map((h, i) => (
                            <Box
                              key={i}
                              sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 1.5, bgcolor: '#fafafa', borderRadius: 1.5 }}
                            >
                              <StatusChip status={h.status} />
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  {formatDateTime(h.changedAt)}
                                </Typography>
                                {h.comment && (
                                  <Typography variant="body2" sx={{ mt: 0.25 }}>{h.comment}</Typography>
                                )}
                              </Box>
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

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>Nuevo reclamo</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <Controller
              name="category"
              control={control}
              render={({ field }) => (
                <TextField select label="Categoría" {...field} size="small">
                  {categoryOptions.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </TextField>
              )}
            />
            <TextField
              label="Ambiente"
              {...register('room', { required: true })}
              placeholder="Ej: Cocina, Baño, Dormitorio"
              size="small"
            />
            <TextField
              label="Descripción" multiline rows={4}
              {...register('description', { required: true, minLength: 10 })}
              helperText="Mínimo 10 caracteres"
              size="small"
            />
            <Box>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                hidden
                onChange={handleFileChange}
              />
              <Button
                variant="outlined"
                startIcon={<PhotoCameraIcon />}
                onClick={() => fileInputRef.current?.click()}
                disabled={photos.length >= 5}
                size="small"
              >
                Adjuntar fotos ({photos.length}/5)
              </Button>
              {photos.length > 0 && (
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                  {photos.map((f, i) => (
                    <Chip
                      key={i}
                      label={f.name.length > 20 ? `${f.name.slice(0, 17)}...` : f.name}
                      size="small"
                      onDelete={() => setPhotos((prev) => prev.filter((_, idx) => idx !== i))}
                      deleteIcon={<CloseIcon />}
                    />
                  ))}
                </Box>
              )}
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={createMut.isPending}>Enviar</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
