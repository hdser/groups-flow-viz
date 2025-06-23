export const API_ENDPOINT = 'https://rpc.aboutcircles.com/';

export const CACHE_KEYS = {
  GROUPS: 'circles-groups',
  FLOWS: 'circles-flows',
  PROFILES: 'circles-profiles',
  BALANCES: 'circles-balances'
};

export const CACHE_DURATION = {
  GROUPS: 5 * 60 * 1000, // 5 minutes
  FLOWS: 60 * 1000, // 1 minute
  PROFILES: 60 * 60 * 1000, // 1 hour
  BALANCES: 2 * 60 * 1000 // 2 minutes
};

export const GRAPH_STYLES = {
  node: {
    'background-color': 'data(color)',
    'label': 'data(label)',
    'text-valign': 'center',
    'text-halign': 'center',
    'color': '#ffffff',
    'font-size': '12px',
    'width': 'data(size)',
    'height': 'data(size)',
    'border-width': '2px',
    'border-color': '#5B21B6'
  },
  nodeLowBalance: {
    'background-color': '#9CA3AF',
    'border-color': '#6B7280',
    'opacity': 0.6
  },
  edge: {
    'line-color': '#9CA3AF',
    'target-arrow-color': '#9CA3AF',
    'target-arrow-shape': 'triangle',
    'curve-style': 'bezier',
    'width': 'data(width)',
    'opacity': 0.7,
    'edge-text-rotation': 'autorotate',
    'label': 'data(label)',
    'font-size': '10px',
    'text-margin-y': -10
  },
  nodeHover: {
    'background-color': '#5B21B6',
    'border-color': '#4C1D95',
    'z-index': 9999
  },
  edgeHover: {
    'line-color': '#7B3FF2',
    'target-arrow-color': '#7B3FF2',
    'opacity': 1,
    'z-index': 9999
  }
};

export const LAYOUT_CONFIGS = {
  fcose: {
    name: 'fcose',
    quality: 'proof',
    animate: true,
    animationDuration: 1000,
    nodeDimensionsIncludeLabels: true,
    nodeRepulsion: 15000,
    idealEdgeLength: 150,
    edgeElasticity: 0.45,
    nestingFactor: 0.1,
    numIter: 2500,
    tile: true,
    tilingPaddingVertical: 10,
    tilingPaddingHorizontal: 10,
    gravity: 0.25,
    gravityRange: 3.8
  },
  breadthfirst: {
    name: 'breadthfirst',
    directed: true,
    spacingFactor: 1.5,
    animate: true,
    animationDuration: 1000,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: true
  },
  circle: {
    name: 'circle',
    animate: true,
    animationDuration: 1000,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: true,
    spacingFactor: 1.5
  },
  concentric: {
    name: 'concentric',
    animate: true,
    animationDuration: 1000,
    avoidOverlap: true,
    nodeDimensionsIncludeLabels: true,
    levelWidth: () => 2,
    concentric: (node) => node.data('totalFlow') || 0,
    spacingFactor: 1.5
  }
};

export const BATCH_SIZE = 10; // Reduced batch size for better rate limiting
export const FLOW_CALCULATION_BATCH = 10;