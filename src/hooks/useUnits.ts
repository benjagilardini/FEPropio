import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { unitApi } from '../api/unitApi';
import type { UnitInput } from '../types';

export function useUnits(page = 1) {
  return useQuery({
    queryKey: ['units', page],
    queryFn: () => unitApi.list({ page }),
  });
}

export function useUnit(unitId: string) {
  return useQuery({
    queryKey: ['units', unitId],
    queryFn: () => unitApi.getById(unitId),
    enabled: !!unitId,
  });
}

export function useCreateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: UnitInput) => unitApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  });
}

export function useUpdateUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: Partial<UnitInput> }) =>
      unitApi.update(unitId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  });
}

export function useDeleteUnit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (unitId: string) => unitApi.remove(unitId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['units'] }),
  });
}
