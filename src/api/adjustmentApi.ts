import { api } from './axiosInstance';
import type { RentAdjustment, IndexComparison, PaginatedResponse } from '../types';

export const adjustmentApi = {
  list: (leaseId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<RentAdjustment>>(`/leases/${leaseId}/adjustments`, { params }).then((r) => r.data),

  getById: (leaseId: string, adjustmentId: string) =>
    api.get<{ data: RentAdjustment }>(`/leases/${leaseId}/adjustments/${adjustmentId}`).then((r) => r.data.data),

  notify: (leaseId: string, adjustmentId: string) =>
    api.post(`/leases/${leaseId}/adjustments/${adjustmentId}/notify`),

  compareIndices: (leaseId: string) =>
    api.get<{ data: IndexComparison }>(`/leases/${leaseId}/index-comparison`).then((r) => r.data.data),
};
