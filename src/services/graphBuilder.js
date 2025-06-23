import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import dagre from 'cytoscape-dagre';
import { GRAPH_STYLES } from '../utils/constants';
import { buildGraphElements } from '../utils/helpers';

// Register the layouts
cytoscape.use(fcose);
cytoscape.use(dagre);

export const createGraphInstance = (container, groups, flows, profiles, balances) => {
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
      }
    ],
    layout: getLayoutConfig(layoutType, nodes, edges),
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

export const getLayoutConfig = (layoutType, nodes, edges) => {
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
      nodeSep: 100,
      edgeSep: 50,
      rankSep: 150,
      nodeDimensionsIncludeLabels: true,
      fit: true,
      spacingFactor: 1.2
    },
    breadthfirst: {
      name: 'breadthfirst',
      directed: true,
      spacingFactor: 1.75,
      animate: true,
      animationDuration: 1000,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      maximal: false,
      grid: false,
      circle: false
    },
    concentric: {
      name: 'concentric',
      animate: true,
      animationDuration: 1000,
      avoidOverlap: true,
      nodeDimensionsIncludeLabels: true,
      spacingFactor: 2,
      startAngle: 3 * Math.PI / 2,
      sweep: 2 * Math.PI,
      clockwise: true,
      equidistant: false,
      minNodeSpacing: 50,
      concentric: (node) => {
        // Arrange by total flow
        const totalFlow = node.data('totalFlow') || 0;
        return totalFlow;
      },
      levelWidth: (nodes) => {
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