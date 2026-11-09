import { useState } from 'react';
import {
  Box, Typography, Paper, TextField, Button, Alert, Grid, Avatar,
  IconButton, InputAdornment, Divider, Chip, alpha, useTheme,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SaveIcon from '@mui/icons-material/Save';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import BadgeOutlinedIcon from '@mui/icons-material/BadgeOutlined';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/axiosInstance';
import { getApiError } from '../../utils/getApiError';
import PageHeader from '../../components/common/PageHeader';

interface ProfileData {
  firstName: string;
  lastName: string;
  phone: string;
}

interface PasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: '1rem' }}>{title}</Typography>
    </Box>
  );
}

export default function AccountPage() {
  const { user } = useAuth();
  const theme = useTheme();
  const [profileMsg, setProfileMsg] = useState('');
  const [passwordMsg, setPasswordMsg] = useState('');
  const [profileError, setProfileError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const profileForm = useForm<ProfileData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      phone: user?.phone || '',
    },
  });

  const passwordForm = useForm<PasswordData>();

  const onProfile = async (data: ProfileData) => {
    try {
      setProfileError('');
      setProfileMsg('');
      await api.put('/users/me', { firstName: data.firstName, lastName: data.lastName, phone: data.phone });
      setProfileMsg('Perfil actualizado correctamente.');
    } catch (err: unknown) {
      setProfileError(getApiError(err, 'Error al actualizar'));
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
      if (data.newPassword.length < 6) {
        setPasswordError('La nueva contraseña debe tener al menos 6 caracteres.');
        return;
      }
      await api.put('/users/me/password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });
      setPasswordMsg('Contraseña actualizada correctamente.');
      passwordForm.reset();
    } catch (err: unknown) {
      setPasswordError(getApiError(err, 'Error al cambiar contraseña'));
    }
  };

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();
  const roleLabel = user?.role === 'landlord' ? 'Propietario' : 'Inquilino';

  return (
    <Box>
      <PageHeader title="Mi cuenta" />

      <Paper
        variant="outlined"
        sx={{
          p: 3, mb: 3, borderColor: 'divider',
          display: 'flex', alignItems: 'center', gap: 3,
        }}
      >
        <Avatar
          sx={{
            width: 72, height: 72, fontSize: '1.5rem', fontWeight: 700,
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            color: 'primary.main',
          }}
        >
          {initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 0.5, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <EmailOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user?.email}</Typography>
            </Box>
            {user?.dni && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <BadgeOutlinedIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>{user.dni}</Typography>
              </Box>
            )}
          </Box>
        </Box>
        <Chip label={roleLabel} color="primary" variant="outlined" size="small" />
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, alignItems: 'start' }}>
        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <SectionTitle
            icon={<PersonOutlineIcon sx={{ fontSize: 22, color: 'primary.main' }} />}
            title="Datos personales"
          />

          {profileMsg && <Alert severity="success" sx={{ mb: 2 }}>{profileMsg}</Alert>}
          {profileError && <Alert severity="error" sx={{ mb: 2 }}>{profileError}</Alert>}

          <Box component="form" onSubmit={profileForm.handleSubmit(onProfile)} noValidate>
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Nombre"
                  fullWidth
                  {...profileForm.register('firstName', { required: true })}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="Apellido"
                  fullWidth
                  {...profileForm.register('lastName', { required: true })}
                />
              </Grid>
            </Grid>

            <TextField
              label="Teléfono"
              fullWidth
              sx={{ mb: 2 }}
              placeholder="Ej: 11 2345-6789"
              {...profileForm.register('phone')}
            />

            <Divider sx={{ my: 2 }} />

            <TextField
              label="DNI"
              value={user?.dni || '—'}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
              sx={{ mb: 2, '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
              helperText="No se puede modificar."
            />

            <TextField
              label="Correo electrónico"
              value={user?.email || ''}
              fullWidth
              slotProps={{ input: { readOnly: true } }}
              sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
              helperText="Es tu usuario de ingreso. No se puede modificar."
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button variant="contained" type="submit" startIcon={<SaveIcon />}>
                Guardar cambios
              </Button>
            </Box>
          </Box>
        </Paper>

        <Paper variant="outlined" sx={{ p: 3, borderColor: 'divider' }}>
          <SectionTitle
            icon={<LockOutlinedIcon sx={{ fontSize: 22, color: 'primary.main' }} />}
            title="Seguridad"
          />
          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
            Cambiá tu contraseña de acceso. Recomendamos al menos 8 caracteres.
          </Typography>

          {passwordMsg && <Alert severity="success" sx={{ mb: 2 }}>{passwordMsg}</Alert>}
          {passwordError && <Alert severity="error" sx={{ mb: 2 }}>{passwordError}</Alert>}

          <Box component="form" onSubmit={passwordForm.handleSubmit(onPassword)} noValidate>
            <TextField
              label="Contraseña actual"
              type={showCurrentPassword ? 'text' : 'password'}
              fullWidth
              sx={{ mb: 2 }}
              {...passwordForm.register('currentPassword', { required: true })}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowCurrentPassword((v) => !v)} edge="end" size="small">
                        {showCurrentPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Divider sx={{ my: 2 }} />

            <TextField
              label="Nueva contraseña"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              sx={{ mb: 2 }}
              {...passwordForm.register('newPassword', { required: true })}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNewPassword((v) => !v)} edge="end" size="small">
                        {showNewPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Repetir nueva contraseña"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              sx={{ mb: 3 }}
              {...passwordForm.register('confirmPassword', { required: true })}
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirmPassword((v) => !v)} edge="end" size="small">
                        {showConfirmPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="outlined" type="submit" startIcon={<LockOutlinedIcon />}>
                Actualizar contraseña
              </Button>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
