import { Box, Typography } from '@mui/material';

export function StatCard({ label, value, subtitle, color }: {
  label: string; value: string; subtitle?: string; color?: string;
}) {
  return (
    <Box sx={{
      flex: 1, p: 1.5, bgcolor: '#fff', border: '1px solid', borderColor: 'divider',
      borderRadius: 2, textAlign: 'center', minWidth: 0,
    }}>
      <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.25 }}>
        {label}
      </Typography>
      <Typography variant="h6" sx={{ fontWeight: 700, color: color || 'primary.main', fontSize: '1.1rem' }}>
        {value}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mt: 0.25 }}>
          {subtitle}
        </Typography>
      )}
    </Box>
  );
}
