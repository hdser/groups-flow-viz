import { useEffect } from 'react';
import { useStore } from './useStore';
import reachabilityAnalyzer from '../services/reachabilityAnalyzer';
import toast from 'react-hot-toast';

export const useReachability = (groups, flows) => {
  const { 
    reachabilityAnalysis, 
    setReachabilityAnalysis, 
    setReachabilityLoading 
  } = useStore();

  useEffect(() => {
    if (!groups || !flows || Object.keys(flows).length === 0) {
      return;
    }

    const analyzeReachability = async () => {
      setReachabilityLoading(true);
      const toastId = toast.loading('Analyzing reachability...');

      try {
        // Give UI time to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const analysis = reachabilityAnalyzer.analyzeNetwork(groups, flows);
        
        setReachabilityAnalysis(analysis);
        
        toast.success(`Analyzed ${analysis.summary.totalNodes} nodes`, {
          id: toastId,
          duration: 3000
        });
        
        console.log('Reachability analysis complete:', analysis.summary);
      } catch (error) {
        console.error('Reachability analysis failed:', error);
        toast.error('Failed to analyze reachability', { id: toastId });
        setReachabilityAnalysis(null);
      } finally {
        setReachabilityLoading(false);
      }
    };

    analyzeReachability();
  }, [groups, flows, setReachabilityAnalysis, setReachabilityLoading]);

  return reachabilityAnalysis;
};