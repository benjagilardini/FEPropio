import { Box, Typography } from '@mui/material';

export function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
      {icon}
      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{title}</Typography>
    </Box>
  );
}
