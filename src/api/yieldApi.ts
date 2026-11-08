import { api } from './axiosInstance';
import type { YieldResult, AnnualYieldResponse } from '../types';

export const yieldApi = {
  calculate: (unitId: string) =>
    api.get<{ data: YieldResult }>(`/units/${unitId}/yield`).then((r) => r.data.data),

  annual: (unitId: string, year: number) =>
    api.get<{ data: AnnualYieldResponse }>('/yield/annual', { params: { unitId, year } }).then((r) => r.data.data),
};
