import { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction,
  IconButton, Button, Chip, Pagination as MuiPagination,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import { formatDateTime } from '../../utils/formatDate';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const markAsReadMut = useMarkAsRead();
  const markAllMut = useMarkAllAsRead();

  if (isLoading) return <LoadingSpinner />;

  const notifications = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Notificaciones</Typography>
        <Button
          startIcon={<DoneAllIcon />}
          onClick={() => markAllMut.mutate()}
          disabled={markAllMut.isPending}
        >
          Marcar todas como leidas
        </Button>
      </Box>

      {notifications.length === 0 ? (
        <EmptyState message="No tenes notificaciones." />
      ) : (
        <>
          <Paper>
            <List>
              {notifications.map((n) => (
                <ListItem
                  key={n.id}
                  divider
                  sx={{ bgcolor: n.readAt ? 'transparent' : 'action.hover' }}
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="subtitle2">{n.title}</Typography>
                        {!n.readAt && <Chip label="Nueva" size="small" color="primary" />}
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2">{n.message}</Typography>
                        <Typography variant="caption" color="text.secondary">{formatDateTime(n.createdAt)}</Typography>
                      </>
                    }
                  />
                  {!n.readAt && (
                    <ListItemSecondaryAction>
                      <IconButton edge="end" onClick={() => markAsReadMut.mutate(n.id)} size="small">
                        <DoneAllIcon fontSize="small" />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          </Paper>
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
