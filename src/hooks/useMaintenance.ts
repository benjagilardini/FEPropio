import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { maintenanceApi } from '../api/maintenanceApi';
import type { MaintenanceInput, MaintenanceStatus } from '../types';

export function useMaintenanceRequests(leaseId: string, page = 1) {
  return useQuery({
    queryKey: ['maintenance', leaseId, page],
    queryFn: () => maintenanceApi.list(leaseId, { page }),
    enabled: !!leaseId,
  });
}

export function useMaintenanceRequest(leaseId: string, requestId: string) {
  return useQuery({
    queryKey: ['maintenance', leaseId, requestId],
    queryFn: () => maintenanceApi.getById(leaseId, requestId),
    enabled: !!leaseId && !!requestId,
  });
}

export function useCreateMaintenanceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, data }: { leaseId: string; data: MaintenanceInput }) =>
      maintenanceApi.create(leaseId, data),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['maintenance', leaseId] }),
  });
}

export function useUpdateMaintenanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, requestId, data }: { leaseId: string; requestId: string; data: { status: MaintenanceStatus; comment?: string } }) =>
      maintenanceApi.updateStatus(leaseId, requestId, data),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['maintenance', leaseId] }),
  });
}
