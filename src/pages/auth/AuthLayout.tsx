import type { ReactNode } from 'react';
import { Box, Paper, Typography } from '@mui/material';
import ApartmentIcon from '@mui/icons-material/Apartment';
import CheckIcon from '@mui/icons-material/Check';

const benefits = [
  'Datos técnicos y suministros de cada unidad',
  'Carga del contrato con extracción asistida',
  'Ajustes estimados aunque el índice no esté publicado',
  'Rendimiento real de cada propiedad',
];

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'row', minHeight: '100vh' }}>
      {/* LEFT PANEL */}
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          justifyContent: 'center',
          width: '40%',
          bgcolor: 'primary.main',
          color: 'white',
          px: 6,
          py: 8,
        }}
      >
        <ApartmentIcon sx={{ fontSize: 56, color: 'white', mb: 2 }} />
        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700, mb: 1 }}>
          Mis Inmuebles
        </Typography>
        <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.85)', mb: 5 }}>
          Administrá tus unidades en alquiler sin intermediarios.
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          {benefits.map((text) => (
            <Box key={text} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <CheckIcon sx={{ color: 'white', fontSize: 22, mt: 0.2 }} />
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.95)', lineHeight: 1.6 }}>
                {text}
              </Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* RIGHT PANEL */}
      <Box
        sx={{
          width: { xs: '100%', md: '60%' },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          px: { xs: 2, sm: 4 },
          py: 4,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 3, sm: 5 },
            width: '100%',
            maxWidth: 480,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
