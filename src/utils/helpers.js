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

export const calculateFlowPairs = (groups) => {
  const pairs = [];
  
  // Generate all possible treasury -> mintHandler pairs
  for (let i = 0; i < groups.length; i++) {
    for (let j = 0; j < groups.length; j++) {
      if (i !== j) {
        const groupA = groups[i];
        const groupB = groups[j];
        
        // Treasury A to MintHandler B
        pairs.push({
          from: groupA.treasury,
          to: groupB.mintHandler,
          fromGroup: groupA.group,
          toGroup: groupB.group,
          key: generatePairKey(groupA.treasury, groupB.mintHandler)
        });
      }
    }
  }
  
  return pairs;
};

export const buildGraphElements = (groups, flows, profiles) => {
  const nodes = [];
  const edges = [];
  const nodeFlows = new Map(); // Track total in/out flows per node
  
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
    
    nodes.push({
      data: {
        id: group.group,
        label: getGroupLabel(group.group, profile),
        treasury: group.treasury,
        mintHandler: group.mintHandler,
        totalIn: flows.in,
        totalOut: flows.out,
        profile
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