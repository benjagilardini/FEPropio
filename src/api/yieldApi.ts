import { api } from './axiosInstance';
import type { YieldResult } from '../types';

export const yieldApi = {
  calculate: (unitId: string) =>
    api.get<{ data: YieldResult }>(`/units/${unitId}/yield`).then((r) => r.data.data),
};
