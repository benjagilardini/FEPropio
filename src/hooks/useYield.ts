import { useQuery } from '@tanstack/react-query';
import { yieldApi } from '../api/yieldApi';

export function useYield(unitId: string) {
  return useQuery({
    queryKey: ['yield', unitId],
    queryFn: () => yieldApi.calculate(unitId),
    enabled: !!unitId,
  });
}

export function useAnnualYield(unitId: string, year: number) {
  return useQuery({
    queryKey: ['yield', 'annual', unitId, year],
    queryFn: () => yieldApi.annual(unitId, year),
    enabled: !!unitId && year > 0,
  });
}
