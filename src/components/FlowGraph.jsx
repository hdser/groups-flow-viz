import { useEffect } from 'react';
import { useGraphData } from '../hooks/useGraphData';
import { useStore } from '../hooks/useStore';
import { updateGraphFilters } from '../services/graphBuilder';

export default function FlowGraph({ groups, flows, profiles }) {
  const { cy, containerRef } = useGraphData(groups, flows, profiles);
  const { minFlowFilter, setSelectedNode, setSelectedFlow, setCyInstance, clearBalances } = useStore();

  useEffect(() => {
    if (!cy) return;

    // Store cy instance in global store for access from other components
    setCyInstance(cy);

    // Update filters when minFlowFilter changes
    updateGraphFilters(cy, minFlowFilter);
  }, [cy, minFlowFilter, setCyInstance]);

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
        sourceTreasury: sourceNodeData.treasury, // Add treasury address
        ...fullFlowData // This includes transfers and all other data
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
    </div>
  );
}