import { api } from './axiosInstance';
import type { PaymentReceipt, PaymentInput, PaginatedResponse } from '../types';

export const paymentApi = {
  create: (leaseId: string, data: PaymentInput) =>
    api.post<{ data: PaymentReceipt }>(`/leases/${leaseId}/payments`, data).then((r) => r.data.data),

  list: (leaseId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<PaymentReceipt>>(`/leases/${leaseId}/payments`, { params }).then((r) => r.data),

  getById: (leaseId: string, paymentId: string) =>
    api.get<{ data: PaymentReceipt }>(`/leases/${leaseId}/payments/${paymentId}`).then((r) => r.data.data),

  confirm: (leaseId: string, paymentId: string) =>
    api.post<{ data: PaymentReceipt }>(`/leases/${leaseId}/payments/${paymentId}/confirm`).then((r) => r.data.data),

  flag: (leaseId: string, paymentId: string, reviewNote: string) =>
    api.post<{ data: PaymentReceipt }>(`/leases/${leaseId}/payments/${paymentId}/flag`, { reviewNote }).then((r) => r.data.data),

  downloadFile: (leaseId: string, paymentId: string) =>
    api.get(`/leases/${leaseId}/payments/${paymentId}/file`, { responseType: 'blob' }),
};
