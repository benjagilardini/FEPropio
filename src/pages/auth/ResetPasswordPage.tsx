import { useState } from 'react';
import { useNavigate, useSearchParams, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Link, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { authApi } from '../../api/authApi';
import { getApiError } from '../../utils/getApiError';
import AuthLayout from './AuthLayout';

interface FormData {
  email: string;
  newPassword: string;
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<FormData>();

  const onSubmit = async (data: FormData) => {
    try {
      setError('');
      await authApi.resetPassword(data.email, token, data.newPassword);
      navigate('/login');
    } catch (err: unknown) {
      setError(getApiError(err, 'Error al restablecer la contraseña'));
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Nueva contraseña
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ingresá tu email y tu nueva contraseña.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField fullWidth label="Correo electrónico" type="email" {...register('email', { required: true })} />
        <TextField
          fullWidth label="Nueva contraseña" type={showPassword ? 'text' : 'password'}
          helperText="Mínimo 8 caracteres, con al menos una letra y un número."
          {...register('newPassword', { required: true })}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((prev) => !prev)}
                    edge="end"
                    size="small"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
        <Button fullWidth variant="contained" type="submit" size="large" disabled={isSubmitting}>
          {isSubmitting ? 'Guardando...' : 'RESTABLECER CONTRASEÑA'}
        </Button>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Link component={RouterLink} to="/login" variant="body2" underline="hover">
          Volver al login
        </Link>
      </Box>
    </AuthLayout>
  );
}
