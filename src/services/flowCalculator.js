import { batchFindPaths } from './circlesRpc';
import { calculateFilteredFlowPairs } from '../utils/helpers';
import cacheService from './cacheService';

export const calculateFilteredFlows = async (allGroups, filteredGroups, onProgress) => {
  console.log(`Filtered groups for flow calculation:`, filteredGroups.length, filteredGroups);
  
  const pairs = calculateFilteredFlowPairs(allGroups, filteredGroups);
  console.log(`Calculating flows for ${pairs.length} pairs (filtered from ${allGroups.length * (allGroups.length - 1)} potential pairs)...`);
  console.log(`Source groups (with balance > threshold):`, filteredGroups.map(g => ({
    group: g.group,
    balance: g.balanceCRC
  })));
  
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