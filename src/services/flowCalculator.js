import { batchFindPaths } from './circlesRpc';
import { calculateFlowPairs } from '../utils/helpers';
import cacheService from './cacheService';

export const calculateAllFlows = async (groups, onProgress) => {
  const pairs = calculateFlowPairs(groups);
  console.log(`Calculating flows for ${pairs.length} pairs...`);
  
  const flows = await batchFindPaths(pairs, onProgress);
  
  return flows;
};

export const getFlowStats = (flows) => {
  const stats = {
    totalFlows: 0,
    totalVolume: 0,
    averageFlow: 0,
    maxFlow: 0,
    minFlow: Infinity
  };

  Object.values(flows).forEach(flow => {
    if (!flow || !flow.maxFlowCrc) return;
    
    const amount = parseFloat(flow.maxFlowCrc);
    if (amount > 0) {
      stats.totalFlows++;
      stats.totalVolume += amount;
      stats.maxFlow = Math.max(stats.maxFlow, amount);
      stats.minFlow = Math.min(stats.minFlow, amount);
    }
  });

  if (stats.totalFlows > 0) {
    stats.averageFlow = stats.totalVolume / stats.totalFlows;
  }

  if (stats.minFlow === Infinity) {
    stats.minFlow = 0;
  }

  return stats;
};