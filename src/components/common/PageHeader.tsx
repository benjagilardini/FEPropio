import { Box, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  actions?: ReactNode;
}

export default function PageHeader({ title, subtitle, chips, actions }: PageHeaderProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        px: 3,
        py: 2,
        mb: 2,
        borderColor: 'divider',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{title}</Typography>
          {chips}
        </Box>
        {subtitle && (
          <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.25 }}>{subtitle}</Typography>
        )}
      </Box>
      {actions && (
        <Box sx={{ display: 'flex', gap: 1, flexShrink: 0, ml: 2 }}>
          {actions}
        </Box>
      )}
    </Paper>
  );
}
