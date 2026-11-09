import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, MenuItem,
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ReceiptOutlinedIcon from '@mui/icons-material/ReceiptOutlined';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import SendIcon from '@mui/icons-material/Send';
import { useLease, useEndLease, useInviteTenant } from '../../hooks/useLeases';
import { useUnit } from '../../hooks/useUnits';
import { useAdjustments } from '../../hooks/useAdjustments';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import PageHeader from '../../components/common/PageHeader';
import StatusChip from '../../components/common/StatusChip';
import { KVRow, KVTable } from '../../components/common/KVTable';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatDate } from '../../utils/formatDate';
import { formatAddress } from '../../utils/formatAddress';
import { formatFreq } from '../../utils/formatters';
import { getApiError } from '../../utils/getApiError';
import { useForm } from 'react-hook-form';

const sectionTitle = { fontWeight: 700, fontSize: '1.05rem', mb: 1.5 };

export default function LeaseDetailPage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const { data: lease, isLoading } = useLease(leaseId!);
  const { data: unit } = useUnit(lease?.unitId || '');
  const { data: adjustmentsData } = useAdjustments(leaseId!);
  const endLeaseMut = useEndLease();
  const inviteMut = useInviteTenant();
  const toast = useToast();

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [restitutionDate, setRestitutionDate] = useState('');
  const [unitDestination, setUnitDestination] = useState<'vacant' | 'renew' | ''>('');
  const [inviteOpen, setInviteOpen] = useState(false);
  const { register, handleSubmit, reset } = useForm<{ email: string; tenantName: string; tenantDni: string }>();

  if (isLoading || !lease) return <LoadingSpinner />;

  const adjustments = adjustmentsData?.data || [];
  const nextAdjustment = adjustments.find((a) => a.status === 'estimated') || adjustments[0];
  const unitAddress = unit ? formatAddress(unit) : '';

  const handleEndLease = async () => {
    try {
      await endLeaseMut.mutateAsync({
        leaseId: leaseId!,
        data: {
          restitutionDate: restitutionDate || undefined,
          unitDestination: unitDestination || undefined,
        },
      });
      toast.success('Contrato finalizado correctamente');
      setEndDialogOpen(false);
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al finalizar'));
    }
  };

  const handleInvite = async (data: { email: string; tenantName: string; tenantDni: string }) => {
    try {
      await inviteMut.mutateAsync({ leaseId: leaseId!, data });
      toast.success('Invitación enviada');
      setInviteOpen(false);
      reset();
    } catch (err: unknown) {
      toast.error(getApiError(err, 'Error al invitar'));
    }
  };

  return (
    <Box>
      <PageHeader
        breadcrumbs={[
          { label: 'Mis unidades', onClick: () => navigate('/units') },
          ...(unit ? [{ label: unitAddress, onClick: () => navigate(`/units/${lease.unitId}`) }] : []),
          { label: 'Contrato' },
        ]}
        title="Contrato"
        subtitle={unit ? `${unitAddress}${lease.tenantName ? ` · ${lease.tenantName}` : ''}` : undefined}
        chips={<StatusChip status={lease.status} />}
        actions={
          <>
            {lease.status === 'draft' && (
              <Button variant="contained" onClick={() => navigate(`/leases/${leaseId}/confirm`)}>
                Confirmar campos
              </Button>
            )}
            {lease.status === 'active' && (
              <Button variant="outlined" color="error" onClick={() => setEndDialogOpen(true)}>
                Finalizar contrato
              </Button>
            )}
          </>
        }
      />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: 3, alignItems: 'start' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Datos del contrato</Typography>
            <KVTable>
              <KVRow label="Vigencia" value={`${formatDate(lease.startDate)} – ${formatDate(lease.endDate)}`} />
              <KVRow label="Alquiler inicial" value={formatCurrency(lease.initialRent)} />
              <KVRow label="Índice de ajuste" value={`${lease.adjustmentIndex} · ${formatFreq(lease.adjustmentFrequencyMonths)}`} />
              {lease.securityDeposit && (
                <KVRow label="Depósito" value={formatCurrency(lease.securityDeposit)} />
              )}
              {lease.endedAt && (
                <>
                  <KVRow label="Finalizado" value={formatDate(lease.endedAt)} />
                  {lease.restitutionDate && (
                    <KVRow label="Restitución" value={formatDate(lease.restitutionDate)} />
                  )}
                  {lease.unitDestination && (
                    <KVRow label="Destino" value={lease.unitDestination === 'renew' ? 'Se renueva contrato' : 'Queda vacante'} />
                  )}
                </>
              )}
            </KVTable>
          </Paper>

          {lease.paymentAccount && (
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionTitle}>Datos de cobro</Typography>
              <KVTable>
                <KVRow label="Titular" value={lease.paymentAccount.holderName} />
                <KVRow label="Banco" value={lease.paymentAccount.bank} />
                <KVRow label="CBU/CVU" value={lease.paymentAccount.cbuOrCvu} />
                {lease.paymentAccount.alias && (
                  <KVRow label="Alias" value={lease.paymentAccount.alias} />
                )}
              </KVTable>
            </Paper>
          )}

          {lease.status === 'active' && nextAdjustment && (
            <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
              <Typography sx={sectionTitle}>Próximo ajuste</Typography>
              <KVTable>
                <KVRow label="Fecha efectiva" value={formatDate(nextAdjustment.effectiveDate)} />
                <KVRow
                  label="Rango estimado"
                  value={`${formatCurrency(nextAdjustment.minAmount)} – ${formatCurrency(nextAdjustment.maxAmount)}`}
                />
              </KVTable>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 1 }}>
                <StatusChip status={nextAdjustment.status} />
                <Button
                  size="small"
                  variant="outlined"
                  startIcon={<TrendingUpIcon />}
                  onClick={() => navigate(`/leases/${leaseId}/adjustments/${nextAdjustment.id}`)}
                  sx={{ textTransform: 'uppercase', ml: 'auto' }}
                >
                  Ver detalle
                </Button>
              </Box>
            </Paper>
          )}
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Inquilino</Typography>
            {lease.tenantName ? (
              <KVTable>
                <KVRow label="Nombre" value={lease.tenantName} />
                <KVRow label="DNI" value={lease.tenantDni} />
                <KVRow label="Email" value={lease.tenantEmail} />
              </KVTable>
            ) : (
              <Typography variant="body2" sx={{ color: 'text.secondary', py: 1 }}>
                Sin datos de inquilino.
              </Typography>
            )}
            {lease.status === 'active' && !lease.tenantId && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<SendIcon />}
                onClick={() => setInviteOpen(true)}
                sx={{ mt: 2, textTransform: 'uppercase' }}
              >
                Invitar inquilino
              </Button>
            )}
          </Paper>

          <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
            <Typography sx={sectionTitle}>Acciones</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<ReceiptOutlinedIcon />}
                onClick={() => navigate(`/leases/${leaseId}/payments`)}
                sx={{ textTransform: 'uppercase', justifyContent: 'center' }}
              >
                Ver pagos
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<BuildOutlinedIcon />}
                onClick={() => navigate(`/leases/${leaseId}/maintenance`)}
                sx={{ textTransform: 'uppercase', justifyContent: 'center' }}
              >
                Ver reclamos
              </Button>
              <Button
                variant="outlined"
                fullWidth
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate(`/leases/${leaseId}/index-comparison`)}
                sx={{ textTransform: 'uppercase', justifyContent: 'center' }}
              >
                Comparar índices
              </Button>
            </Box>
          </Paper>
        </Box>
      </Box>

      <Dialog open={endDialogOpen} onClose={() => setEndDialogOpen(false)}>
        <DialogTitle>Finalizar contrato</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350, pt: '16px !important' }}>
          <Typography variant="body2" color="text.secondary">
            Esta acción no se puede deshacer. Completá los datos de finalización.
          </Typography>
          <TextField
            label="Fecha de restitución del inmueble"
            type="date"
            value={restitutionDate}
            onChange={(e) => setRestitutionDate(e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            select
            label="Destino de la unidad"
            value={unitDestination}
            onChange={(e) => setUnitDestination(e.target.value as 'vacant' | 'renew')}
          >
            <MenuItem value="">Sin definir</MenuItem>
            <MenuItem value="vacant">Queda vacante</MenuItem>
            <MenuItem value="renew">Se renueva contrato</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)}>Cancelar</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleEndLease}
            disabled={endLeaseMut.isPending}
          >
            {endLeaseMut.isPending ? 'Finalizando...' : 'Finalizar contrato'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)}>
        <DialogTitle>Invitar inquilino</DialogTitle>
        <Box component="form" onSubmit={handleSubmit(handleInvite)}>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 350 }}>
            <TextField label="Nombre completo" {...register('tenantName', { required: true })} defaultValue={lease.tenantName || ''} />
            <TextField label="DNI" {...register('tenantDni', { required: true })} defaultValue={lease.tenantDni || ''} />
            <TextField label="Email" type="email" {...register('email', { required: true })} defaultValue={lease.tenantEmail || ''} />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setInviteOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained" disabled={inviteMut.isPending}>
              {inviteMut.isPending ? 'Enviando...' : 'Enviar invitación'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
