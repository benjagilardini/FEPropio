import { Box, Breadcrumbs, Link, Paper, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  chips?: ReactNode;
  actions?: ReactNode;
  breadcrumbs?: BreadcrumbItem[];
}

export default function PageHeader({ title, subtitle, chips, actions, breadcrumbs }: PageHeaderProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        mx: -3,
        px: 3,
        pt: breadcrumbs ? 1.5 : 2,
        pb: 2,
        mb: 2,
        borderRadius: 0,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs sx={{ mb: 1 }}>
          {breadcrumbs.map((bc, i) =>
            i < breadcrumbs.length - 1 ? (
              <Link
                key={i}
                underline="hover"
                color="inherit"
                sx={{ cursor: 'pointer', fontSize: '0.875rem' }}
                onClick={bc.onClick}
              >
                {bc.label}
              </Link>
            ) : (
              <Typography key={i} sx={{ fontSize: '0.875rem', color: 'text.primary' }}>
                {bc.label}
              </Typography>
            ),
          )}
        </Breadcrumbs>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
      </Box>
    </Paper>
  );
}
