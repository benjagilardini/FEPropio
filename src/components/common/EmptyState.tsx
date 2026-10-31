import { Box, Typography, Paper, Button } from '@mui/material';
import InboxIcon from '@mui/icons-material/Inbox';
import type { SvgIconComponent } from '@mui/icons-material';
import type { ReactNode } from 'react';

interface Props {
  message: string;
  description?: string;
  Icon?: SvgIconComponent;
  action?: ReactNode;
}

export default function EmptyState({ message, description, Icon = InboxIcon, action }: Props) {
  return (
    <Paper
      elevation={0}
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        py: 8,
        px: 4,
        border: '2px dashed',
        borderColor: 'divider',
        bgcolor: 'transparent',
      }}
    >
      <Box
        sx={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mb: 3,
        }}
      >
        <Icon sx={{ fontSize: 40, color: 'text.disabled' }} />
      </Box>
      <Typography variant="h6" color="text.primary" gutterBottom>
        {message}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 400, textAlign: 'center' }}>
          {description}
        </Typography>
      )}
      {action}
    </Paper>
  );
}
