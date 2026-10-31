import { useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Alert,
  Link,
  Grid,
  Checkbox,
  FormControlLabel,
  IconButton,
  InputAdornment,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import type { RegisterInput } from '../../types';
import AuthLayout from './AuthLayout';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<RegisterInput>();

  const onSubmit = async (data: RegisterInput) => {
    try {
      setError('');
      await registerUser(data);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al registrarse');
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" sx={{ mb: 1 }}>
        Crear cuenta
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Registrate como propietario para empezar a cargar tus unidades.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Nombre" {...register('firstName', { required: true })} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField fullWidth label="Apellido" {...register('lastName', { required: true })} />
          </Grid>
        </Grid>

        <TextField fullWidth label="DNI" {...register('dni', { required: true })} />

        <TextField
          fullWidth
          label="Correo electrónico"
          type="email"
          {...register('email', { required: true })}
        />

        <TextField
          fullWidth
          label="Contraseña"
          type={showPassword ? 'text' : 'password'}
          helperText="Mínimo 8 caracteres, con al menos una letra y un número."
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

        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              size="small"
            />
          }
          label={
            <Typography variant="body2" color="text.secondary">
              Acepto los{' '}
              <Link href="/terms" underline="hover">
                términos y la política de privacidad
              </Link>
            </Typography>
          }
          sx={{ mr: 0 }}
        />

        <Button
          fullWidth
          variant="contained"
          type="submit"
          size="large"
          disabled={isSubmitting || !acceptedTerms}
        >
          {isSubmitting ? 'Creando cuenta...' : 'CREAR CUENTA'}
        </Button>
      </Box>

      <Box sx={{ mt: 3, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          ¿Ya tenés cuenta?{' '}
          <Link component={RouterLink} to="/login" underline="hover" fontWeight={600}>
            Ingresá
          </Link>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
