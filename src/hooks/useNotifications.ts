import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notificationApi';

export function useNotifications(page = 1) {
  return useQuery({
    queryKey: ['notifications', page],
    queryFn: () => notificationApi.list({ page }),
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unreadCount'],
    queryFn: () => notificationApi.getUnreadCount(),
  });
}

export function useMarkAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllAsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllAsRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
