import { api } from './axiosInstance';
import type { MaintenanceRequest, MaintenanceInput, MaintenanceStatus, PaginatedResponse } from '../types';

export const maintenanceApi = {
  create: (leaseId: string, data: MaintenanceInput, photos?: File[]) => {
    const formData = new FormData();
    formData.append('category', data.category);
    formData.append('room', data.room);
    formData.append('description', data.description);
    if (photos?.length) {
      photos.forEach((f) => formData.append('photos', f));
    }
    return api.post<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  list: (leaseId: string, params?: { page?: number; limit?: number }) =>
    api.get<PaginatedResponse<MaintenanceRequest>>(`/leases/${leaseId}/maintenance`, { params }).then((r) => r.data),

  getById: (leaseId: string, requestId: string) =>
    api.get<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance/${requestId}`).then((r) => r.data.data),

  updateStatus: (leaseId: string, requestId: string, data: { status: MaintenanceStatus; comment?: string }) =>
    api.post<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance/${requestId}/status`, data).then((r) => r.data.data),

  uploadPhotos: (leaseId: string, requestId: string, photos: File[]) => {
    const formData = new FormData();
    photos.forEach((f) => formData.append('photos', f));
    return api.post<{ data: MaintenanceRequest }>(`/leases/${leaseId}/maintenance/${requestId}/photos`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }).then((r) => r.data.data);
  },

  getPhotoUrl: (leaseId: string, requestId: string, photoIndex: number) =>
    `/leases/${leaseId}/maintenance/${requestId}/photos/${photoIndex}`,
};
