import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../api/paymentApi';
import type { PaymentInput } from '../types';

export function usePayments(leaseId: string, page = 1) {
  return useQuery({
    queryKey: ['payments', leaseId, page],
    queryFn: () => paymentApi.list(leaseId, { page }),
    enabled: !!leaseId,
  });
}

export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, data }: { leaseId: string; data: PaymentInput }) =>
      paymentApi.create(leaseId, data),
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
