import { useQuery } from '@tanstack/react-query';
import { fetchGroups, fetchProfiles } from '../services/circlesRpc';
import { CACHE_DURATION } from '../utils/constants';

export const useGroups = () => {
  return useQuery({
    queryKey: ['groups'],
    queryFn: fetchGroups,
    staleTime: CACHE_DURATION.GROUPS,
    gcTime: CACHE_DURATION.GROUPS * 2,
  });
};

export const useProfiles = (addresses) => {
  return useQuery({
    queryKey: ['profiles', addresses],
    queryFn: () => fetchProfiles(addresses),
    staleTime: CACHE_DURATION.PROFILES,
    gcTime: CACHE_DURATION.PROFILES * 2,
    enabled: addresses && addresses.length > 0,
  });
};