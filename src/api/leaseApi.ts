import { api } from './axiosInstance';
import type { Lease, LeaseInput, PaymentAccount, PaginatedResponse } from '../types';

export const leaseApi = {
  create: (unitId: string, data: LeaseInput, file?: File) => {
    const formData = new FormData();
    formData.append('data', JSON.stringify(data));
    if (file) formData.append('contract', file);
    return api.post<{ data: Lease }>(`/units/${unitId}/leases`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  extract: (leaseId: string) =>
    api.post<{ data: Lease }>(`/leases/${leaseId}/extract`).then((r) => r.data.data),

  listByUnit: (unitId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Lease>>(`/units/${unitId}/leases`, { params }).then((r) => r.data),

  getById: (leaseId: string) =>
    api.get<{ data: Lease }>(`/leases/${leaseId}`).then((r) => r.data.data),

  update: (leaseId: string, data: Partial<LeaseInput>) =>
    api.put<{ data: Lease }>(`/leases/${leaseId}`, data).then((r) => r.data.data),

  activate: (leaseId: string) =>
    api.post<{ data: Lease }>(`/leases/${leaseId}/activate`).then((r) => r.data.data),

  endLease: (leaseId: string, data?: { restitutionDate?: string; unitDestination?: 'vacant' | 'renew' }) =>
    api.post<{ data: Lease }>(`/leases/${leaseId}/end`, data ?? {}).then((r) => r.data.data),

  confirmField: (leaseId: string, fieldIndex: number) =>
    api.put(`/leases/${leaseId}/fields/${fieldIndex}/confirm`).then((r) => r.data.data),

  correctField: (leaseId: string, fieldIndex: number, correctedValue: unknown) =>
    api.put(`/leases/${leaseId}/fields/${fieldIndex}/correct`, { correctedValue }).then((r) => r.data.data),

  updatePaymentAccount: (leaseId: string, data: PaymentAccount) =>
    api.put<{ data: Lease }>(`/leases/${leaseId}/payment-account`, data).then((r) => r.data.data),

  inviteTenant: (leaseId: string, data: { email: string; tenantName: string; tenantDni: string }) =>
    api.post(`/leases/${leaseId}/invite`, data),

  resendInvitation: (leaseId: string) =>
    api.post(`/leases/${leaseId}/resend-invitation`),

  downloadDocument: (leaseId: string) =>
    api.get(`/leases/${leaseId}/document`, { responseType: 'blob' }),

  getUnitForTenant: (leaseId: string) =>
    api.get(`/leases/${leaseId}/unit`).then((r) => r.data.data),

  getTenantLeases: () =>
    api.get<{ data: Lease[] }>('/tenant/leases').then((r) => r.data.data),
};
