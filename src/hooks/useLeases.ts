import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { leaseApi } from '../api/leaseApi';
import type { LeaseInput, PaymentAccount } from '../types';

export function useLeasesByUnit(unitId: string, page = 1) {
  return useQuery({
    queryKey: ['leases', 'unit', unitId, page],
    queryFn: () => leaseApi.listByUnit(unitId, { page }),
    enabled: !!unitId,
  });
}

export function useLease(leaseId: string) {
  return useQuery({
    queryKey: ['leases', leaseId],
    queryFn: () => leaseApi.getById(leaseId),
    enabled: !!leaseId,
  });
}

export function useTenantLeases() {
  return useQuery({
    queryKey: ['tenant', 'leases'],
    queryFn: () => leaseApi.getTenantLeases(),
  });
}

export function useCreateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, data, file }: { unitId: string; data: LeaseInput; file?: File }) =>
      leaseApi.create(unitId, data, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leases'] }),
  });
}

export function useExtractLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: string) => leaseApi.extract(leaseId),
    onSuccess: (lease) => qc.invalidateQueries({ queryKey: ['leases', lease.id] }),
  });
}

export function useUpdateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, data }: { leaseId: string; data: Partial<LeaseInput> }) =>
      leaseApi.update(leaseId, data),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['leases', leaseId] }),
  });
}

export function useActivateLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: string) => leaseApi.activate(leaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leases'] }),
  });
}

export function useEndLease() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (leaseId: string) => leaseApi.endLease(leaseId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leases'] }),
  });
}

export function useConfirmField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, fieldIndex }: { leaseId: string; fieldIndex: number }) =>
      leaseApi.confirmField(leaseId, fieldIndex),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['leases', leaseId] }),
  });
}

export function useCorrectField() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, fieldIndex, value }: { leaseId: string; fieldIndex: number; value: unknown }) =>
      leaseApi.correctField(leaseId, fieldIndex, value),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['leases', leaseId] }),
  });
}

export function useUpdatePaymentAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leaseId, data }: { leaseId: string; data: PaymentAccount }) =>
      leaseApi.updatePaymentAccount(leaseId, data),
    onSuccess: (_, { leaseId }) => qc.invalidateQueries({ queryKey: ['leases', leaseId] }),
  });
}

export function useInviteTenant() {
  return useMutation({
    mutationFn: ({ leaseId, data }: { leaseId: string; data: { email: string; tenantName: string; tenantDni: string } }) =>
      leaseApi.inviteTenant(leaseId, data),
  });
}
