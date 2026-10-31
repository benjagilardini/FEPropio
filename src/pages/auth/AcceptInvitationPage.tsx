import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Container, Paper, TextField, Button, Typography, Alert } from '@mui/material';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { useForm } from 'react-hook-form';
import { api } from '../../api/axiosInstance';

interface FormData {
  password: string;
}

export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await api.post('/auth/accept-invitation', { token, password: data.password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al aceptar la invitación');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        py: 4,
      }}
    >
      <Container maxWidth="xs">
        <Paper elevation={0} sx={{ p: 5, border: '1px solid', borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mb: 3 }}>
            <Box
              sx={{
                width: 48, height: 48, borderRadius: '50%',
                bgcolor: 'primary.main', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
              }}
            >
              <HowToRegIcon sx={{ color: 'white' }} />
            </Box>
            <Typography variant="h5">Activar cuenta</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
              Creá tu contraseña para acceder al sistema.
            </Typography>
          </Box>

          {success ? (
            <Alert severity="success">Cuenta activada. Redirigiendo al login...</Alert>
          ) : (
            <>
              {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
              <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth label="Contraseña" type="password"
                  helperText="Mínimo 8 caracteres, al menos una letra y un número"
                  {...register('password', { required: true })}
                />
                <Button fullWidth variant="contained" type="submit" size="large" disabled={isSubmitting}>
                  {isSubmitting ? 'Activando...' : 'Activar cuenta'}
                </Button>
              </Box>
            </>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
