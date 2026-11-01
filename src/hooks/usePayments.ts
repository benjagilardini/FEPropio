import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';

export function usePayments(leaseId: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['payments', leaseId, page, limit],
    queryFn: () => paymentApi.list(leaseId, { page, limit }),
    enabled: !!leaseId,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, data, file }: {
      leaseId: string;
      data: { period: string; amount?: string; paymentDate: string; message?: string };
      file?: File;
    }) => paymentApi.create(leaseId, data, file),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['payments', leaseId] }),
  });
}

export function useConfirmPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, paymentId }: { leaseId: string; paymentId: string }) =>
      paymentApi.confirm(leaseId, paymentId),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['payments', leaseId] }),
  });
}

export function useFlagPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, paymentId, reviewNote }: { leaseId: string; paymentId: string; reviewNote: string }) =>
      paymentApi.flag(leaseId, paymentId, reviewNote),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['payments', leaseId] }),
  });
}
