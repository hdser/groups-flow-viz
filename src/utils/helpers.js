import { FLOW_CALCULATION_BATCH } from './constants';
import { formatCRC, getGroupLabel } from './formatters';

export const chunk = (array, size) => {
  const chunks = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const generatePairKey = (from, to) => {
  return `${from.toLowerCase()}_${to.toLowerCase()}`;
};

export const parsePairKey = (key) => {
  const [from, to] = key.split('_');
  return { from, to };
};

export const calculateFilteredFlowPairs = (allGroups, filteredGroups) => {
  const pairs = [];
  const filteredGroupIds = new Set(filteredGroups.map(g => g.group.toLowerCase()));
  
  console.log(`Creating pairs: ${filteredGroups.length} source groups × ${allGroups.length} target groups`);
  
  // Only calculate flows FROM treasuries with sufficient balance
  for (const sourceGroup of filteredGroups) {
    for (const targetGroup of allGroups) {
      if (sourceGroup.group !== targetGroup.group) {
        pairs.push({
          from: sourceGroup.treasury,
          to: targetGroup.mintHandler,
          fromGroup: sourceGroup.group,
          toGroup: targetGroup.group,
          sourceBalance: sourceGroup.balanceCRC,
          key: generatePairKey(sourceGroup.treasury, targetGroup.mintHandler)
        });
      }
    }
  }
  
  console.log(`Created ${pairs.length} flow pairs from ${filteredGroups.length} groups with balance >= threshold`);
  
  return pairs;
};

export const buildGraphElements = (groups, flows, profiles, balances) => {
  const nodes = [];
  const edges = [];
  const nodeFlows = new Map();
  const balanceMap = new Map();
  
  // Create balance map
  if (balances) {
    balances.forEach(b => {
      balanceMap.set(b.group.toLowerCase(), b.balanceCRC);
    });
  }
  
  // Calculate total flows per node
  Object.entries(flows).forEach(([key, flow]) => {
    if (!flow || flow.maxFlow === '0') return;
    
    const { fromGroup, toGroup } = flow;
    const flowAmount = parseFloat(flow.maxFlowCrc || 0);
    
    if (!nodeFlows.has(fromGroup)) {
      nodeFlows.set(fromGroup, { in: 0, out: 0 });
    }
    if (!nodeFlows.has(toGroup)) {
      nodeFlows.set(toGroup, { in: 0, out: 0 });
    }
    
    nodeFlows.get(fromGroup).out += flowAmount;
    nodeFlows.get(toGroup).in += flowAmount;
  });
  
  // Create nodes
  groups.forEach(group => {
    const profile = profiles[group.group.toLowerCase()];
    const flows = nodeFlows.get(group.group) || { in: 0, out: 0 };
    const balance = balanceMap.get(group.group.toLowerCase()) || 0;
    const totalFlow = flows.in + flows.out;
    
    // Calculate node size based on total flow
    const minSize = 40;
    const maxSize = 100;
    const maxFlow = Math.max(...Array.from(nodeFlows.values()).map(f => f.in + f.out), 1);
    const size = minSize + (maxSize - minSize) * (totalFlow / maxFlow);
    
    // Color based on balance
    let color = '#7B3FF2'; // Default purple
    if (balance === 0) {
      color = '#9CA3AF'; // Gray for zero balance
    } else if (balance < 100) {
      color = '#F59E0B'; // Amber for low balance
    } else if (balance > 10000) {
      color = '#10B981'; // Green for high balance
    }
    
    nodes.push({
      data: {
        id: group.group,
        label: getGroupLabel(group.group, profile),
        treasury: group.treasury,
        mintHandler: group.mintHandler,
        totalIn: flows.in,
        totalOut: flows.out,
        totalFlow,
        balance,
        profile,
        size,
        color,
        lowBalance: balance < 1000
      }
    });
  });
  
  // Create edges
  Object.entries(flows).forEach(([key, flow]) => {
    if (!flow || flow.maxFlow === '0') return;
    
    const flowAmount = parseFloat(flow.maxFlowCrc || 0);
    if (flowAmount === 0) return;
    
    edges.push({
      data: {
        id: key,
        source: flow.fromGroup,
        target: flow.toGroup,
        flow: flowAmount,
        label: formatCRC(flowAmount),
        width: Math.max(1, Math.min(10, Math.log10(flowAmount + 1) * 3))
      }
    });
  });
  
  return { nodes, edges };
};