import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateFilteredFlows } from '../services/flowCalculator';
import { CACHE_DURATION } from '../utils/constants';
import toast from 'react-hot-toast';

export const useFlowCalculations = (allGroups, filteredGroups, calculationKey) => {
  const [progress, setProgress] = useState(0);

  const query = useQuery({
    queryKey: ['flows', calculationKey], // Use calculation key instead of group data
    queryFn: async () => {
      if (!allGroups || allGroups.length === 0 || !filteredGroups || filteredGroups.length === 0) {
        return {};
      }
      
      const toastId = toast.loading('Calculating flows...', {
        duration: Infinity
      });
      
      try {
        setProgress(0); // Reset progress
        const flows = await calculateFilteredFlows(allGroups, filteredGroups, (p) => {
          setProgress(p);
          toast.loading(`Calculating flows... ${Math.round(p * 100)}%`, {
            id: toastId
          });
        });
        
        toast.success(`Calculated ${Object.keys(flows).length} flows!`, {
          id: toastId
        });
        
        return flows;
      } catch (error) {
        toast.error('Failed to calculate flows', { id: toastId });
        throw error;
      }
    },
    staleTime: Infinity, // Never refetch automatically
    gcTime: Infinity, // Keep in cache forever
    enabled: calculationKey > 0 && !!allGroups && allGroups.length > 0 && !!filteredGroups && filteredGroups.length > 0,
  });

  return {
    ...query,
    progress
  };
};