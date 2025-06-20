import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import { GRAPH_STYLES } from '../utils/constants';
import { buildGraphElements } from '../utils/helpers';

// Register the fcose layout
cytoscape.use(fcose);

export const createGraphInstance = (container, groups, flows, profiles) => {
  const { nodes, edges } = buildGraphElements(groups, flows, profiles);
  
  const cy = cytoscape({
    container,
    elements: [...nodes, ...edges],
    style: [
      {
        selector: 'node',
        style: GRAPH_STYLES.node
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
    layout: {
      name: 'fcose',
      quality: 'proof',
      animate: true,
      animationDuration: 1000,
      nodeDimensionsIncludeLabels: true,
      nodeRepulsion: 10000,
      idealEdgeLength: 100,
      edgeElasticity: 0.45,
      nestingFactor: 0.1,
      numIter: 2500,
      tile: true,
      tilingPaddingVertical: 10,
      tilingPaddingHorizontal: 10,
      gravity: 0.25,
      gravityRange: 3.8
    }
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