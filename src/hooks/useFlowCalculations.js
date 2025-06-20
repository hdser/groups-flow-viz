import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { calculateAllFlows } from '../services/flowCalculator';
import { CACHE_DURATION } from '../utils/constants';
import toast from 'react-hot-toast';

export const useFlowCalculations = (groups) => {
  const [progress, setProgress] = useState(0);

  const query = useQuery({
    queryKey: ['flows', groups?.length],
    queryFn: async () => {
      if (!groups || groups.length === 0) return {};
      
      const toastId = toast.loading('Calculating flows...', {
        duration: Infinity
      });
      
      try {
        const flows = await calculateAllFlows(groups, (p) => {
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
    staleTime: CACHE_DURATION.FLOWS,
    gcTime: CACHE_DURATION.FLOWS * 2,
    enabled: !!groups && groups.length > 0,
  });

  return {
    ...query,
    progress
  };
};