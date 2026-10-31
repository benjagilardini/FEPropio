import { useQuery, useMutation } from '@tanstack/react-query';
import { adjustmentApi } from '../api/adjustmentApi';

export function useAdjustments(leaseId: string, page = 1) {
  return useQuery({
    queryKey: ['adjustments', leaseId, page],
    queryFn: () => adjustmentApi.list(leaseId, { page }),
    enabled: !!leaseId,
  });
}

export function useAdjustment(leaseId: string, adjustmentId: string) {
  return useQuery({
    queryKey: ['adjustments', leaseId, adjustmentId],
    queryFn: () => adjustmentApi.getById(leaseId, adjustmentId),
    enabled: !!leaseId && !!adjustmentId,
  });
}

export function useNotifyAdjustment() {
  return useMutation({
    mutationFn: ({ leaseId, adjustmentId }: { leaseId: string; adjustmentId: string }) =>
      adjustmentApi.notify(leaseId, adjustmentId),
  });
}

export function useIndexComparison(leaseId: string) {
  return useQuery({
    queryKey: ['indexComparison', leaseId],
    queryFn: () => adjustmentApi.compareIndices(leaseId),
    enabled: !!leaseId,
  });
}
