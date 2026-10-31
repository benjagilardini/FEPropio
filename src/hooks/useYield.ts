import { useQuery } from '@tanstack/react-query';
import { yieldApi } from '../api/yieldApi';

export function useYield(unitId: string) {
  return useQuery({
    queryKey: ['yield', unitId],
    queryFn: () => yieldApi.calculate(unitId),
    enabled: !!unitId,
  });
}
