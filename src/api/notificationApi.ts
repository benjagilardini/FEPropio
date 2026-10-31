import { api } from './axiosInstance';
import type { Notification, PaginatedResponse } from '../types';

export const notificationApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Notification>>('/notifications', { params }).then((r) => r.data),

  getUnreadCount: () =>
    api.get<{ data: { count: number } }>('/notifications/unread-count').then((r) => r.data.data.count),

  markAsRead: (notificationId: string) =>
    api.post(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    api.post('/notifications/read-all'),
};
