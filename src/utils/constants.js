export const API_ENDPOINT = 'https://rpc.aboutcircles.com/';

export const CACHE_KEYS = {
  GROUPS: 'circles-groups',
  FLOWS: 'circles-flows',
  PROFILES: 'circles-profiles'
};

export const CACHE_DURATION = {
  GROUPS: 5 * 60 * 1000, // 5 minutes
  FLOWS: 60 * 1000, // 1 minute
  PROFILES: 60 * 60 * 1000 // 1 hour
};

export const GRAPH_STYLES = {
  node: {
    'background-color': '#7B3FF2',
    'label': 'data(label)',
    'text-valign': 'center',
    'text-halign': 'center',
    'color': '#ffffff',
    'font-size': '12px',
    'width': '60px',
    'height': '60px',
    'border-width': '2px',
    'border-color': '#5B21B6'
  },
  edge: {
    'line-color': '#9CA3AF',
    'target-arrow-color': '#9CA3AF',
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'width': 'data(width)',
    'opacity': 0.7
  },
  nodeHover: {
    'background-color': '#5B21B6',
    'border-color': '#4C1D95'
  },
  edgeHover: {
    'line-color': '#7B3FF2',
    'target-arrow-color': '#7B3FF2',
    'opacity': 1
  }
};

export const BATCH_SIZE = 50;
export const FLOW_CALCULATION_BATCH = 10;