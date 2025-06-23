import { useQuery } from '@tanstack/react-query';
import { fetchGroups, fetchProfiles, batchGetTreasuryBalances } from '../services/circlesRpc';
import { CACHE_DURATION } from '../utils/constants';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: Infinity,
    gcTime: CACHE_DURATION.GROUPS * 2,
  });
};

export const useTreasuryBalances = (groups) => {
  return useQuery({
    queryKey: ['treasuryBalances', groups?.length],
    queryFn: () => batchGetTreasuryBalances(groups),
    staleTime: Infinity,
    gcTime: CACHE_DURATION.BALANCES * 2,
    enabled: !!groups && groups.length > 0,
  });
};

export const useProfiles = (addresses) => {
  return useQuery({
    queryKey: ['profiles', addresses],
    queryFn: () => fetchProfiles(addresses),
    staleTime: Infinity,
    gcTime: CACHE_DURATION.PROFILES * 2,
    enabled: addresses && addresses.length > 0,
  });
};