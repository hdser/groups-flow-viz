import { useEffect, useRef } from 'react';
import { useGraphData } from '../hooks/useGraphData';
import { useStore } from '../hooks/useStore';
import { updateGraphFilters, getLayoutConfig } from '../services/graphBuilder';

export default function FlowGraph({ groups, flows, profiles, balances }) {
  const { cy, containerRef } = useGraphData(groups, flows, profiles, balances);
  const { 
    minFlowFilter, 
    setSelectedNode, 
    setSelectedFlow, 
    setCyInstance, 
    clearBalances,
    layoutType 
  } = useStore();
  const layoutRef = useRef(layoutType);

  useEffect(() => {
    if (!cy) return;

    // Store cy instance in global store for access from other components
    setCyInstance(cy);

    // Update filters when minFlowFilter changes
    updateGraphFilters(cy, minFlowFilter);
  }, [cy, minFlowFilter, setCyInstance]);

  // Update layout when layoutType changes
  useEffect(() => {
    if (!cy) return;
    
    // Only update layout if it actually changed
    if (layoutRef.current !== layoutType) {
      layoutRef.current = layoutType;
      const elements = cy.elements();
      const layout = cy.layout(getLayoutConfig(layoutType, elements.nodes(), elements.edges()));
      layout.run();
    }
  }, [cy, layoutType]);

  useEffect(() => {
    if (!cy) return;

    // Handle node selection
    const handleNodeClick = (evt) => {
      const node = evt.target;
      setSelectedNode({
        id: node.id(),
        ...node.data()
      });
      setSelectedFlow(null); // Clear flow selection
      clearBalances(); // Clear any loaded balances
    };

    // Handle edge selection
    const handleEdgeClick = (evt) => {
      const edge = evt.target;
      const edgeData = edge.data();
      
      // Find the full flow data from the flows object
      const fullFlowData = flows[edgeData.id];
      
      // Get the source node to extract treasury address
      const sourceNode = cy.getElementById(edgeData.source);
      const sourceNodeData = sourceNode.data();
      
      setSelectedFlow({
        id: edge.id(),
        source: edgeData.source,
        target: edgeData.target,
        flow: edgeData.flow,
        sourceTreasury: sourceNodeData.treasury,
        ...fullFlowData
      });
      setSelectedNode(null); // Clear node selection
    };

    cy.on('tap', 'node', handleNodeClick);
    cy.on('tap', 'edge', handleEdgeClick);

    return () => {
      cy.off('tap', 'node', handleNodeClick);
      cy.off('tap', 'edge', handleEdgeClick);
    };
  }, [cy, setSelectedNode, setSelectedFlow, flows, clearBalances]);

  return (
    <div className="relative h-full">
      <div id="cy" ref={containerRef} className="w-full h-full rounded-lg" />
      {/* Graph controls */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={() => cy?.fit()}
          className="bg-white px-3 py-1 rounded shadow-md text-sm hover:bg-gray-50"
          title="Fit to view"
        >
          Fit
        </button>
        <button
          onClick={() => cy?.center()}
          className="bg-white px-3 py-1 rounded shadow-md text-sm hover:bg-gray-50"
          title="Center"
        >
          Center
        </button>
        <button
          onClick={() => {
            if (cy) {
              const layout = cy.layout(getLayoutConfig(layoutType, cy.nodes(), cy.edges()));
              layout.run();
            }
          }}
          className="bg-white px-3 py-1 rounded shadow-md text-sm hover:bg-gray-50"
          title="Re-run layout"
        >
          Relayout
        </button>
      </div>
    </div>
  );
}