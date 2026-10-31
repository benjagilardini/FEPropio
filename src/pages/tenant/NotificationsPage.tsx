import { useState } from 'react';
import {
  Box, Typography, Paper, Button, IconButton,
  Pagination as MuiPagination,
} from '@mui/material';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import CircleIcon from '@mui/icons-material/Circle';
import { useNotifications, useMarkAsRead, useMarkAllAsRead } from '../../hooks/useNotifications';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import PageHeader from '../../components/common/PageHeader';
import { formatDateTime } from '../../utils/formatDate';

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useNotifications(page);
  const markAsReadMut = useMarkAsRead();
  const markAllMut = useMarkAllAsRead();

  if (isLoading) return <LoadingSpinner />;

  const notifications = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const hasUnread = notifications.some((n) => !n.readAt);

  return (
    <Box>
      <PageHeader
        title="Notificaciones"
        actions={
          hasUnread && (
            <Button
              variant="outlined"
              startIcon={<DoneAllIcon />}
              onClick={() => markAllMut.mutate()}
              disabled={markAllMut.isPending}
            >
              Marcar todas como leídas
            </Button>
          )
        }
      />

      {notifications.length === 0 ? (
        <EmptyState
          message="No tenés notificaciones."
          description="Las actualizaciones sobre tu contrato, pagos y reclamos van a aparecer acá."
          Icon={NotificationsNoneIcon}
        />
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {notifications.map((n) => (
            <Paper
              key={n.id}
              variant="outlined"
              sx={{
                px: 2.5, py: 2,
                borderColor: 'divider',
                bgcolor: n.readAt ? 'transparent' : 'action.hover',
                transition: 'background-color 0.2s',
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                {!n.readAt && (
                  <CircleIcon sx={{ fontSize: 10, color: 'primary.main', mt: 0.75, flexShrink: 0 }} />
                )}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: n.readAt ? 500 : 700 }}>
                      {n.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 0.5 }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {formatDateTime(n.createdAt)}
                  </Typography>
                </Box>
                {!n.readAt && (
                  <IconButton
                    size="small"
                    onClick={() => markAsReadMut.mutate(n.id)}
                    disabled={markAsReadMut.isPending}
                    sx={{ flexShrink: 0, color: 'text.secondary' }}
                  >
                    <DoneAllIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <MuiPagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} />
        </Box>
      )}
    </Box>
  );
}
