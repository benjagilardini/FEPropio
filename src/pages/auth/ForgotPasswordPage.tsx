import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Link } from '@mui/material';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/authApi';
import { getApiError } from '../../utils/getApiError';
import AuthLayout from './AuthLayout';

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string }>();

  const onSubmit = async (data: { email: string }) => {
    try {
      setError('');
      await authApi.forgotPassword(data.email);
      setSent(true);
    } catch (err: unknown) {
      setError(getApiError(err, 'Error al enviar el correo'));
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Recuperar contraseña
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ingresá tu email y te enviaremos un enlace para restablecer tu contraseña.
      </Typography>

      {sent ? (
        <Alert severity="success">
          Si el correo está registrado, recibirás un enlace de recuperación.
        </Alert>
      ) : (
        <>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField fullWidth label="Correo electrónico" type="email" {...register('email', { required: true })} />
            <Button fullWidth variant="contained" type="submit" size="large" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'ENVIAR ENLACE'}
            </Button>
          </Box>
        </>
      )}

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" variant="body2" underline="hover">
          Volver al login
        </Link>
      </Box>
    </AuthLayout>
  );
}
