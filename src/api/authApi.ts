import { api } from './axiosInstance';
import type { User, RegisterInput, LoginInput } from '../types';

export const authApi = {
  login: (data: LoginInput) =>
    api.post<{ data: User }>('/auth/login', data).then((r) => r.data.data),

  register: (data: RegisterInput) =>
    api.post<{ data: User }>('/auth/register', data).then((r) => r.data.data),

  logout: () => api.post('/auth/logout'),

  getMe: () =>
    api.get<{ data: User }>('/auth/me').then((r) => r.data.data),

  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),

  resetPassword: (email: string, token: string, newPassword: string) =>
    api.post('/auth/reset-password', { email, token, newPassword }),
};
