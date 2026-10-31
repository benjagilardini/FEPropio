import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expenseApi } from '../api/expenseApi';
import type { ExpenseInput } from '../types';

export function useExpenses(unitId: string, page = 1, filters?: { category?: string; from?: string; to?: string }) {
  return useQuery({
    queryKey: ['expenses', unitId, page, filters],
    queryFn: () => expenseApi.list(unitId, { page, ...filters }),
    enabled: !!unitId,
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, data }: { unitId: string; data: ExpenseInput }) =>
      expenseApi.create(unitId, data),
    onSuccess: (_, { unitId }) => qc.invalidateQueries({ queryKey: ['expenses', unitId] }),
  });
}

export function useUpdateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, expenseId, data }: { unitId: string; expenseId: string; data: Partial<ExpenseInput> }) =>
      expenseApi.update(unitId, expenseId, data),
    onSuccess: (_, { unitId }) => qc.invalidateQueries({ queryKey: ['expenses', unitId] }),
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ unitId, expenseId }: { unitId: string; expenseId: string }) =>
      expenseApi.remove(unitId, expenseId),
    onSuccess: (_, { unitId }) => qc.invalidateQueries({ queryKey: ['expenses', unitId] }),
  });
}
