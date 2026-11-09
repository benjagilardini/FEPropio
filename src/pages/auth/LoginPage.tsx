import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { Box, TextField, Button, Typography, Alert, Link, IconButton, InputAdornment } from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../utils/getApiError';
import type { LoginInput } from '../../types';
import AuthLayout from './AuthLayout';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { register, handleSubmit, formState: { isSubmitting } } = useForm<LoginInput>();

  const onSubmit = async (data: LoginInput) => {
    try {
      setError('');
      await login(data.email, data.password);
      navigate('/');
    } catch (err: unknown) {
      setError(getApiError(err, 'Error al iniciar sesión'));
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Iniciar sesión
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Ingresá a tu cuenta para administrar tus propiedades.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          fullWidth label="Correo electrónico" type="email"
          {...register('email', { required: true })}
        />
        <TextField
          fullWidth label="Contraseña" type={showPassword ? 'text' : 'password'}
          {...register('password', { required: true })}
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
        <Button
          fullWidth variant="contained" type="submit" size="large"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Ingresando...' : 'INGRESAR'}
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1, mt: 3 }}>
        <Link component={RouterLink} to="/forgot-password" variant="body2" underline="hover">
          ¿Olvidaste tu contraseña?
        </Link>
        <Typography variant="body2" color="text.secondary">
          ¿No tenés cuenta?{' '}
          <Link component={RouterLink} to="/register" underline="hover" sx={{ fontWeight: 600 }}>
            Registrate
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
