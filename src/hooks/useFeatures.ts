import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';

export interface FeatureFlags {
  disabledPages: string[];
  enableTokenGating: boolean;
  isTeaserMode: boolean;
  maxPortfolios: number;
  maxWhales: number;
  enableAlphaAi: boolean;
  enableSecurityScanner: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  disabledPages: [],
  enableTokenGating: false,
  isTeaserMode: false,
  maxPortfolios: 5,
  maxWhales: 5,
  enableAlphaAi: true,
  enableSecurityScanner: true,
};

export const useFeatures = () => {
  return useQuery({
    queryKey: ['config', 'features'],
    queryFn: async (): Promise<FeatureFlags> => {
      try {
        const res = await api.get('/api/config/features');
        return { ...DEFAULT_FLAGS, ...res.data };
      } catch {
        return DEFAULT_FLAGS;
      }
    },
    staleTime: 5 * 60_000,
    retry: 3,
  });
};
