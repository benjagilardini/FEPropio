import { api } from './axiosInstance';
import type { Unit, UnitInput, PaginatedResponse } from '../types';

export const unitApi = {
  list: (params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<Unit>>('/units', { params }).then((r) => r.data),

  getById: (unitId: string) =>
    api.get<{ data: Unit }>(`/units/${unitId}`).then((r) => r.data.data),

  create: (data: UnitInput) =>
    api.post<{ data: Unit }>('/units', data).then((r) => r.data.data),

  update: (unitId: string, data: Partial<UnitInput>) =>
    api.put<{ data: Unit }>(`/units/${unitId}`, data).then((r) => r.data.data),

  remove: (unitId: string) => api.delete(`/units/${unitId}`),
};
