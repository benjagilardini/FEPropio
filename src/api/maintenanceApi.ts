import { api } from './axiosInstance';
import type { MaintenanceRequest, MaintenanceInput, MaintenanceStatus, PaginatedResponse } from '../types';

export const maintenanceApi = {
  create: (leaseId: string, data: MaintenanceInput) =>
    api.post<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance`, data).then((r) => r.data.data),

  list: (leaseId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<MaintenanceRequest>>(`/leases/${leaseId}/maintenance`, { params }).then((r) => r.data),

  getById: (leaseId: string, requestId: string) =>
    api.get<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance/${requestId}`).then((r) => r.data.data),

  updateStatus: (leaseId: string, requestId: string, data: { status: MaintenanceStatus; comment?: string }) =>
    api.post<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance/${requestId}/status`, data).then((r) => r.data.data),
};
