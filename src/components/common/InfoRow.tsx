import { Box, Typography } from '@mui/material';

export function InfoRow({ label, value, bold, color }: {
  label: string; value: string | null | undefined; bold?: boolean; color?: string;
}) {
  if (!value) return null;
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', py: 0.75 }}>
      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: bold ? 700 : 500, color: color || 'text.primary', textAlign: 'right' }}>
        {value}
      </Typography>
    </Box>
  );
}
