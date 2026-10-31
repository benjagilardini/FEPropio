import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Grid,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axiosInstance';

interface ProfileData {
  fullName: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function AccountPage() {
  const { user } = useAuth();
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileData>({
    defaultValues: {
      fullName: user ? `${user.firstName} ${user.lastName}` : '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordData>();

  const onProfile = async (data: ProfileData) => {
    try {
      setProfileError('');
      setProfileMsg('');
      const [firstName, ...rest] = data.fullName.trim().split(' ');
      const lastName = rest.join(' ');
      await api.put('/users/me', { firstName, lastName, phone: data.phone });
      setProfileMsg('Perfil actualizado.');
    } catch (err: any) {
      setProfileError(err.response?.data?.message || 'Error al actualizar');
    }
  };

  const onPassword = async (data: PasswordData) => {
    try {
      setPasswordError('');
      setPasswordMsg('');
      if (data.newPassword !== data.confirmPassword) {
        setPasswordError('Las contraseñas no coinciden.');
        return;
      }
      await api.put('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordMsg('Contraseña actualizada.');
      passwordForm.reset();
    } catch (err: any) {
      setPasswordError(err.response?.data?.message || 'Error al cambiar contraseña');
    }
  };

  return (
    <Box>
      {/* Breadcrumb */}
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Mi cuenta
      </Typography>

      {/* Title */}
      <Typography variant="h5" sx={{ mb: 3 }}>
        Mi cuenta
      </Typography>

      <Grid container spacing={3}>
        {/* Left card – Personal data */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Datos personales
            </Typography>

            {profileMsg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {profileMsg}
              </Alert>
            )}
            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}

            <Box component="form" onSubmit={profileForm.handleSubmit(onProfile)} noValidate>
              <TextField
                label="Nombre y apellido"
                fullWidth
                sx={{ mb: 2 }}
                {...profileForm.register('fullName', { required: true })}
              />

              <Box display="flex" gap={2} sx={{ mb: 2 }}>
                <TextField
                  label="DNI"
                  value={user?.dni || ''}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  sx={{ bgcolor: 'action.hover' }}
                />
                <TextField
                  label="Teléfono"
                  fullWidth
                  {...profileForm.register('phone')}
                />
              </Box>

              <TextField
                label="Correo electrónico"
                value={user?.email || ''}
                fullWidth
                InputProps={{ readOnly: true }}
                sx={{ bgcolor: 'action.hover', mb: 0.5 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                Es tu usuario de ingreso.
              </Typography>

              <Box display="flex" justifyContent="center">
                <Button variant="contained" type="submit">
                  Guardar cambios
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>

        {/* Right card – Security */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Seguridad
            </Typography>

            {passwordMsg && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {passwordMsg}
              </Alert>
            )}
            {passwordError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {passwordError}
              </Alert>
            )}

            <Box component="form" onSubmit={passwordForm.handleSubmit(onPassword)} noValidate>
              <TextField
                label="Contraseña actual"
                type={showCurrentPassword ? 'text' : 'password'}
                fullWidth
                sx={{ mb: 2 }}
                {...passwordForm.register('currentPassword', { required: true })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword((v) => !v)}
                        edge="end"
                        aria-label="toggle current password visibility"
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Nueva contraseña"
                type={showNewPassword ? 'text' : 'password'}
                fullWidth
                sx={{ mb: 2 }}
                {...passwordForm.register('newPassword', { required: true })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((v) => !v)}
                        edge="end"
                        aria-label="toggle new password visibility"
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <TextField
                label="Repetir nueva contraseña"
                type={showConfirmPassword ? 'text' : 'password'}
                fullWidth
                sx={{ mb: 3 }}
                {...passwordForm.register('confirmPassword', { required: true })}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((v) => !v)}
                        edge="end"
                        aria-label="toggle confirm password visibility"
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button variant="outlined" type="submit" fullWidth>
                Actualizar contraseña
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
