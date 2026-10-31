import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Paper, Button, Breadcrumbs, Link,
  Stepper, Step, StepLabel, TextField, Alert, Grid,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckIcon from '@mui/icons-material/Check';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useLease, useInviteTenant } from '../../hooks/useLeases';
import { useUnit } from '../../hooks/useUnits';
import { useToast } from '../../context/ToastContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';

const steps = ['Cargar documento', 'Confirmar datos', 'Habilitar acceso al locatario'];

const accessItems = [
  'Ficha t\u00E9cnica de la unidad y suministros',
  'Contrato y documento original',
  'Estimaci\u00F3n del pr\u00F3ximo ajuste',
  'Carga de comprobantes de pago',
  'Reclamos de mantenimiento con seguimiento',
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function LeaseInvitePage() {
  const { leaseId } = useParams<{ leaseId: string }>();
  const navigate = useNavigate();
  const { data: lease, isLoading } = useLease(leaseId!);
  const { data: unit } = useUnit(lease?.unitId || '');
  const inviteMut = useInviteTenant();

  const toast = useToast();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  if (isLoading || !lease) return <LoadingSpinner />;

  const tenantName = lease.tenantName || '';
  const tenantDni = lease.tenantDni || '';

  const unitAddress = unit
    ? `${unit.address.street} ${unit.address.number}${unit.address.floor ? `, ${unit.address.floor}.\u00B0` : ''}${unit.address.apartment ? ` ${unit.address.apartment}` : ''}`
    : '';

  const handleInvite = async () => {
    if (!email) {
      setError('Ingres\u00E1 el correo electr\u00F3nico del locatario.');
      return;
    }
    try {
      setError('');
      await inviteMut.mutateAsync({
        leaseId: leaseId!,
        data: { email, tenantName, tenantDni },
      });
      toast.success('Invitación enviada correctamente');
      setSent(true);
      setTimeout(() => navigate(`/leases/${leaseId}`), 1500);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Error al enviar la invitación';
      setError(msg);
      toast.error(msg);
    }
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Breadcrumbs sx={{ mb: 1 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate('/units')}>
          Mis unidades
        </Link>
        {unit && (
          <Link underline="hover" color="inherit" sx={{ cursor: 'pointer', fontSize: '0.875rem' }} onClick={() => navigate(`/units/${lease.unitId}`)}>
            {unitAddress}
          </Link>
        )}
        <Typography sx={{ fontSize: '0.875rem', color: 'text.primary' }}>Nuevo contrato</Typography>
      </Breadcrumbs>

      {/* Title */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 0.5 }}>
        Habilitar acceso al locatario
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
        Contrato registrado. Invit&aacute; al locatario para que acceda a la informaci&oacute;n de la unidad.
      </Typography>

      {/* Stepper */}
      <Stepper activeStep={2} sx={{ mb: 4 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {sent && <Alert severity="success" sx={{ mb: 2 }}>Invitaci&oacute;n enviada correctamente.</Alert>}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        {/* Left: Tenant data */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 1 }}>
            Datos del locatario
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            El nombre y el DNI se toman del contrato confirmado.
          </Typography>

          <Grid container spacing={2}>
            <Grid size={{ xs: 8 }}>
              <TextField
                fullWidth
                label="Nombre y apellido"
                value={tenantName}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid size={{ xs: 4 }}>
              <TextField
                fullWidth
                label="DNI"
                value={tenantDni}
                disabled
                sx={{ '& .MuiOutlinedInput-root': { bgcolor: '#f5f5f5' } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                label="Correo electr\u00F3nico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="locatario@email.com"
                helperText="Le enviamos un enlace para activar su cuenta."
                sx={{ '& .MuiOutlinedInput-root': { borderColor: 'primary.main' } }}
              />
            </Grid>
          </Grid>

          {/* Info alert */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 1,
              mt: 2,
              p: 2,
              bgcolor: 'info.main',
              borderRadius: 1.5,
              color: 'info.contrastText',
              opacity: 0.9,
            }}
          >
            <InfoOutlinedIcon sx={{ fontSize: 20, mt: 0.25 }} />
            <Typography variant="body2">
              El acceso queda habilitado mientras el contrato est&eacute; vigente ({formatDate(lease.startDate)} &ndash; {formatDate(lease.endDate)}).
              Al finalizar, pasa a solo lectura: contrato e historial.
            </Typography>
          </Box>
        </Paper>

        {/* Right: What they can see */}
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <Typography sx={{ fontWeight: 700, fontSize: '1.05rem', mb: 2 }}>
            Qu&eacute; va a poder ver
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {accessItems.map((item) => (
              <Box key={item} sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CheckIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                <Typography variant="body2">{item}</Typography>
              </Box>
            ))}
          </Box>
        </Paper>
      </Box>

      {/* Buttons */}
      <Box sx={{ display: 'flex', gap: 2, mt: 3, justifyContent: 'flex-end' }}>
        <Button
          onClick={() => navigate(`/leases/${leaseId}`)}
          sx={{ textTransform: 'uppercase', fontWeight: 600 }}
        >
          Omitir por ahora
        </Button>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={handleInvite}
          disabled={inviteMut.isPending || sent}
        >
          {inviteMut.isPending ? 'Enviando...' : 'Enviar invitaci\u00F3n'}
        </Button>
      </Box>
    </Box>
  );
}
