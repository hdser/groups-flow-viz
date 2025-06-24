import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import { GRAPH_STYLES } from '../utils/constants';
import { buildGraphElements } from '../utils/helpers';

// Register the layouts
cytoscape.use(fcose);
cytoscape.use(dagre);

export const createGraphInstance = (container, groups, flows, profiles, balances, reachabilityAnalysis) => {
  const { nodes, edges } = buildGraphElements(groups, flows, profiles, balances);
  
  // Calculate layout based on initial layout type
  const layoutType = 'fcose'; // default
  
  const cy = cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: 'node',
        style: GRAPH_STYLES.node
      },
      {
        selector: 'node[?lowBalance]',
        style: GRAPH_STYLES.nodeLowBalance
      },
      {
        selector: 'edge',
        style: GRAPH_STYLES.edge
      },
      {
        selector: '.highlighted',
        style: {
          'background-color': '#10B981',
          'border-color': '#059669',
          'line-color': '#10B981',
          'target-arrow-color': '#10B981',
          'z-index': 9999
        }
      },
      {
        selector: '.hovered',
        style: GRAPH_STYLES.nodeHover
      },
      {
        selector: 'edge.hovered',
        style: GRAPH_STYLES.edgeHover
      },
      {
        selector: '.temp-edge',
        style: {
          'display': 'none'
        }
      }
    ],
    layout: getLayoutConfig(layoutType, nodes, edges, reachabilityAnalysis),
    minZoom: 0.1,
    maxZoom: 4,
    wheelSensitivity: 0.2
  });

  // Add hover effects programmatically
  cy.on('mouseover', 'node', (evt) => {
    evt.target.addClass('hovered');
  });

  cy.on('mouseout', 'node', (evt) => {
    evt.target.removeClass('hovered');
  });

  cy.on('mouseover', 'edge', (evt) => {
    evt.target.addClass('hovered');
  });

  cy.on('mouseout', 'edge', (evt) => {
    evt.target.removeClass('hovered');
  });

  // Add click interactivity
  cy.on('tap', 'node', (evt) => {
    const node = evt.target;
    
    // Clear previous highlights
    cy.elements().removeClass('highlighted');
    
    // Highlight the node and its connections
    node.addClass('highlighted');
    node.connectedEdges().addClass('highlighted');
    node.connectedEdges().connectedNodes().addClass('highlighted');
  });

  cy.on('tap', (evt) => {
    if (evt.target === cy) {
      cy.elements().removeClass('highlighted');
    }
  });

  return cy;
};

export const getLayoutConfig = (layoutType, nodes, edges, reachabilityAnalysis = null) => {
  const configs = {
    fcose: {
      name: 'fcose',
      quality: 'default',
      animate: true,
      animationDuration: 1000,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: 50000,
      idealEdgeLength: edge => {
        // Shorter edges for higher flows
        const flow = edge.data('flow') || 1;
        return 200 / Math.log(flow + 2);
      },
      edgeElasticity: edge => {
        // Stronger pull for higher flows
        const flow = edge.data('flow') || 1;
        return Math.log(flow + 1) * 0.1;
      },
      nestingFactor: 0.1,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 40,
      tilingPaddingHorizontal: 40,
      gravity: 0.4,
      gravityRange: 3.8,
      initialEnergyOnIncremental: 0.5
    },
    cose: {
      name: 'cose',
      animate: true,
      animationDuration: 1000,
      nodeRepulsion: 400000,
      nodeOverlap: 20,
      idealEdgeLength: 200,
      edgeElasticity: 100,
      nestingFactor: 5,
      gravity: 80,
      numIter: 1000,
      initialTemp: 200,
      coolingFactor: 0.95,
      minTemp: 1.0
    },
    grid: {
      name: 'grid',
      animate: true,
      animationDuration: 1000,
      avoidOverlap: true,
      avoidOverlapPadding: 50,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1.5,
      condense: false,
      rows: Math.ceil(Math.sqrt(nodes.length)),
      cols: Math.ceil(Math.sqrt(nodes.length))
    },
    dagre: {
      name: 'dagre',
      rankDir: 'TB', // Top to bottom
      animate: true,
      animationDuration: 1000,
      nodeSep: 80, // Reduced for better fit
      edgeSep: 30,
      rankSep: 100, // Reduced for better fit
      nodeDimensionsIncludeLabels: true,
      fit: true,
      padding: 30,
      spacingFactor: 1.2,
      ranker: 'tight-tree' // Better for sparse graphs
    },
    concentric: {
      name: 'concentric',
      animate: true,
      animationDuration: 1000,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 1.5,
      startAngle: 3 * Math.PI / 2,
      sweep: 2 * Math.PI,
      clockwise: true,
      equidistant: false,
      minNodeSpacing: 50,
      fit: true,
      padding: 50,
      concentric: (node) => {
        // Arrange by connectivity
        const degree = node.degree ? node.degree() : 0;
        const hasFlow = node.data('totalIn') > 0 || node.data('totalOut') > 0;
        
        // Prioritize nodes with flows
        if (hasFlow) {
          return 100 + degree; // Inner circles for connected nodes
        }
        return 1; // Outer circle for isolated nodes
      },
      levelWidth: (nodes) => {
        // More space between levels
        return 2;
      }
    }
  };

  return configs[layoutType] || configs.fcose;
};

export const updateGraphFilters = (cy, minFlow) => {
  if (!cy) return;
  
  cy.edges().forEach(edge => {
    const flow = edge.data('flow');
    if (flow < minFlow) {
      edge.hide();
    } else {
      edge.show();
    }
  });
  
  // Hide isolated nodes
  cy.nodes().forEach(node => {
    const visibleEdges = node.connectedEdges().filter(':visible');
    if (visibleEdges.length === 0) {
      node.hide();
    } else {
      node.show();
    }
  });
};

export const applyHierarchicalLayout = (cy, reachabilityAnalysis) => {
  if (!cy || !reachabilityAnalysis) return;

  const levels = reachabilityAnalysis.levels;
  const levelOrder = ['source', 'intermediate', 'sink', 'isolated'];
  
  // Get viewport dimensions
  const viewportWidth = cy.width();
  const viewportHeight = cy.height();
  
  // Calculate positions for each level
  const levelYPositions = {
    source: 100,
    intermediate: viewportHeight * 0.4,
    sink: viewportHeight * 0.7,
    isolated: viewportHeight * 0.9
  };

  // Position nodes by level with better spacing
  levelOrder.forEach(level => {
    const nodes = levels[level];
    if (nodes.length === 0) return;
    
    const levelY = levelYPositions[level];
    
    // Calculate grid layout for large number of nodes
    const nodesPerRow = Math.ceil(Math.sqrt(nodes.length * 2)); // Wider than tall
    const xSpacing = Math.min(150, viewportWidth / (nodesPerRow + 1));
    const ySpacing = 80;
    
    nodes.forEach((nodeData, index) => {
      const node = cy.getElementById(nodeData.group);
      if (node) {
        const row = Math.floor(index / nodesPerRow);
        const col = index % nodesPerRow;
        
        // Center the grid
        const totalWidth = (nodesPerRow - 1) * xSpacing;
        const xOffset = (viewportWidth - totalWidth) / 2;
        
        node.position({
          x: xOffset + col * xSpacing,
          y: levelY + row * ySpacing
        });
      }
    });
  });

  // Apply layout with animation
  cy.layout({
    name: 'preset',
    animate: true,
    animationDuration: 1000,
    fit: true,
    padding: 50
  }).run();
};

// Helper to handle disconnected nodes for tree/dag layouts
export const preprocessDisconnectedNodes = (cy) => {
  const connectedNodes = cy.nodes().filter(n => n.degree() > 0);
  const disconnectedNodes = cy.nodes().filter(n => n.degree() === 0);
  
  // Create temporary edges for disconnected nodes to include them in layout
  const tempEdges = [];
  if (connectedNodes.length > 0 && disconnectedNodes.length > 0) {
    // Find the node with the highest degree
    let hubNode = null;
    let maxDegree = 0;
    connectedNodes.forEach(node => {
      const degree = node.degree();
      if (degree > maxDegree) {
        maxDegree = degree;
        hubNode = node;
      }
    });
    
    if (hubNode) {
      disconnectedNodes.forEach((node, i) => {
        const tempEdge = cy.add({
          group: 'edges',
          data: {
            id: `temp-edge-${i}`,
            source: hubNode.id(),
            target: node.id(),
            temp: true
          },
          classes: 'temp-edge'
        });
        tempEdges.push(tempEdge);
      });
    }
  }
  
  return tempEdges;
};

// Helper to remove temporary edges after layout
export const removeTemporaryEdges = (cy, tempEdges) => {
  tempEdges.forEach(edge => cy.remove(edge));
};

// Custom concentric layout for sparse networks
export const applyCustomConcentricLayout = (cy) => {
  const viewportWidth = cy.width();
  const viewportHeight = cy.height();
  const centerX = viewportWidth / 2;
  const centerY = viewportHeight / 2;
  
  // Separate nodes by connectivity
  const connectedNodes = cy.nodes().filter(n => n.degree() > 0);
  const isolatedNodes = cy.nodes().filter(n => n.degree() === 0);
  
  // Calculate safe radius that fits in viewport
  const maxRadius = Math.min(viewportWidth, viewportHeight) * 0.4;
  
  // Position connected nodes in the center area
  if (connectedNodes.length > 0) {
    if (connectedNodes.length <= 10) {
      // For few connected nodes, arrange in a small circle
      const radius = Math.min(150, maxRadius * 0.3);
      connectedNodes.forEach((node, index) => {
        const angle = (index / connectedNodes.length) * 2 * Math.PI - Math.PI / 2;
        node.position({
          x: centerX + radius * Math.cos(angle),
          y: centerY + radius * Math.sin(angle)
        });
      });
    } else {
      // For many connected nodes, use a grid in the center
      const cols = Math.ceil(Math.sqrt(connectedNodes.length));
      const rows = Math.ceil(connectedNodes.length / cols);
      const spacing = Math.min(80, (maxRadius * 0.8) / cols);
      
      connectedNodes.forEach((node, index) => {
        const col = index % cols;
        const row = Math.floor(index / cols);
        node.position({
          x: centerX - ((cols - 1) * spacing) / 2 + col * spacing,
          y: centerY - ((rows - 1) * spacing) / 2 + row * spacing
        });
      });
    }
  }
  
  // Position isolated nodes in a single outer ring
  if (isolatedNodes.length > 0) {
    const outerRadius = maxRadius * 0.85;
    const angleStep = (2 * Math.PI) / isolatedNodes.length;
    
    isolatedNodes.forEach((node, index) => {
      const angle = index * angleStep - Math.PI / 2;
      node.position({
        x: centerX + outerRadius * Math.cos(angle),
        y: centerY + outerRadius * Math.sin(angle)
      });
    });
  }
  
  // Apply layout animation
  cy.layout({
    name: 'preset',
    animate: true,
    animationDuration: 1000,
    fit: true,
    padding: 30
  }).run();
};

// Override layout runner for problematic layouts
export const runLayoutWithFixes = (cy, layoutType, layoutConfig) => {
  let tempEdges = [];
  
  // Get viewport dimensions for better layout constraints
  const viewportWidth = cy.width();
  const viewportHeight = cy.height();
  
  // Special handling for different layout types
  switch (layoutType) {
    case 'dagre': {
      // For DAG layout with sparse network
      const connectedNodes = cy.nodes().filter(n => n.degree() > 0);
      const disconnectedNodes = cy.nodes().filter(n => n.degree() === 0);
      
      // Always use custom positioning for sparse networks
      if (disconnectedNodes.length > 50 || connectedNodes.length < 10) {
        // Position connected nodes at top
        const connectedCols = Math.min(connectedNodes.length, 10);
        const connectedXSpacing = Math.min(100, viewportWidth / (connectedCols + 1));
        
        connectedNodes.forEach((node, index) => {
          const col = index % connectedCols;
          const row = Math.floor(index / connectedCols);
          node.position({
            x: (viewportWidth / 2) - ((connectedCols - 1) * connectedXSpacing / 2) + (col * connectedXSpacing),
            y: 50 + row * 100
          });
        });
        
        // Position disconnected nodes in grid below
        const disconnectedCols = Math.ceil(Math.sqrt(disconnectedNodes.length * 1.5));
        const disconnectedXSpacing = Math.min(80, viewportWidth / (disconnectedCols + 1));
        const startY = 300;
        
        disconnectedNodes.forEach((node, index) => {
          const col = index % disconnectedCols;
          const row = Math.floor(index / disconnectedCols);
          node.position({
            x: (viewportWidth / 2) - ((disconnectedCols - 1) * disconnectedXSpacing / 2) + (col * disconnectedXSpacing),
            y: startY + row * 60
          });
        });
        
        // Fit and center
        setTimeout(() => {
          cy.fit(undefined, 30);
          cy.center();
        }, 500);
        
        return;
      }
      break;
    }
    
    case 'concentric': {
      // Let Cytoscape handle the concentric layout with viewport constraints
      // Don't override - just ensure it fits
      break;
    }
  }
  
  // For other layouts, use standard approach
  const layout = cy.layout(layoutConfig);
  
  layout.on('layoutstop', () => {
    // Ensure everything fits in viewport
    setTimeout(() => {
      cy.fit(undefined, 30);
    }, 100);
  });
  
  layout.run();
  
  return layout;
};