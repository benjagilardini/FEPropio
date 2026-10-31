import { api } from './axiosInstance';
import type { Expense, ExpenseInput, PaginatedResponse } from '../types';

export const expenseApi = {
  create: (unitId: string, data: ExpenseInput) =>
    api.post<{ data: Expense }>(`/units/${unitId}/expenses`, data).then((r) => r.data.data),

  list: (unitId: string, params?: { page?: number; limit?: number; category?: string; from?: string; to?: string }) =>
    api.get<PaginatedResponse<Expense>>(`/units/${unitId}/expenses`, { params }).then((r) => r.data),

  getById: (unitId: string, expenseId: string) =>
    api.get<{ data: Expense }>(`/units/${unitId}/expenses/${expenseId}`).then((r) => r.data.data),

  update: (unitId: string, expenseId: string, data: Partial<ExpenseInput>) =>
    api.put<{ data: Expense }>(`/units/${unitId}/expenses/${expenseId}`, data).then((r) => r.data.data),

  remove: (unitId: string, expenseId: string) =>
    api.delete(`/units/${unitId}/expenses/${expenseId}`),
};
