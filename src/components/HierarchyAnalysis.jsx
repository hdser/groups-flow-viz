import { useState, useMemo } from 'react';
import { useStore } from '../hooks/useStore';
import { formatAddress, formatCRC } from '../utils/formatters';

export default function HierarchyAnalysis({ analysis, profiles }) {
  const { 
    setSelectedReachabilityNode, 
    selectedReachabilityNode,
    hierarchyViewMode,
    setHierarchyViewMode,
    cyInstance
  } = useStore();
  
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [sortBy, setSortBy] = useState('hierarchyScore');
  const [sortOrder, setSortOrder] = useState('desc');

  // Get filtered and sorted nodes
  const displayNodes = useMemo(() => {
    if (!analysis) return [];
    
    let nodes = [...analysis.nodes];
    
    // Filter by level
    if (selectedLevel !== 'all') {
      const levelNodes = analysis.levels[selectedLevel].map(n => n.group);
      nodes = nodes.filter(n => levelNodes.includes(n.group));
    }
    
    // Sort nodes
    nodes.sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });
    
    return nodes;
  }, [analysis, selectedLevel, sortBy, sortOrder]);

  const highlightNodeInGraph = (nodeId) => {
    if (!cyInstance) {
      console.warn('Cytoscape instance not available');
      return;
    }
    
    // Clear previous highlights
    cyInstance.elements().removeClass('highlighted');
    
    // Highlight the selected node and its connections
    const node = cyInstance.getElementById(nodeId);
    if (node && node.length > 0) {
      node.addClass('highlighted');
      node.connectedEdges().addClass('highlighted');
      
      // Center on the node
      cyInstance.animate({
        center: { eles: node },
        zoom: 1.5,
        duration: 500
      });
    }
  };

  const handleNodeClick = (node) => {
    setSelectedReachabilityNode(node);
    highlightNodeInGraph(node.group);
  };

  if (!analysis) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No reachability analysis available</p>
      </div>
    );
  }

  const getLevelIcon = (level) => {
    switch(level) {
      case 'source': return <span className="text-green-500">↑</span>;
      case 'sink': return <span className="text-red-500">↓</span>;
      case 'intermediate': return <span className="text-blue-500">→</span>;
      default: return null;
    }
  };

  const getLevelColor = (level) => {
    switch(level) {
      case 'source': return 'text-green-600 bg-green-50';
      case 'sink': return 'text-red-600 bg-red-50';
      case 'intermediate': return 'text-blue-600 bg-blue-50';
      case 'isolated': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Summary Stats */}
      <div className="card">
        <h3 className="font-semibold mb-3">Hierarchy Summary</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="text-green-500">↑</span>
                Sources:
              </span>
              <span className="font-medium">{analysis.summary.sourcesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="text-blue-500">→</span>
                Intermediates:
              </span>
              <span className="font-medium">{analysis.summary.intermediatesCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="text-red-500">↓</span>
                Sinks:
              </span>
              <span className="font-medium">{analysis.summary.sinksCount}</span>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Components:</span>
              <span className="font-medium">{analysis.summary.componentsCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Largest:</span>
              <span className="font-medium">{analysis.summary.largestComponentSize} nodes</span>
            </div>
            <div className="flex justify-between">
              <span>Isolated:</span>
              <span className="font-medium">{analysis.summary.isolatedCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Flow Patterns */}
      <div className="card">
        <h3 className="font-semibold mb-3">Flow Patterns</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Downward (hierarchy-respecting):</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${analysis.flowPatterns.downwardPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {analysis.flowPatterns.downwardPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Lateral (same level):</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${analysis.flowPatterns.lateralPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {analysis.flowPatterns.lateralPercent.toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Upward (counter-hierarchy):</span>
            <div className="flex items-center gap-2">
              <div className="w-24 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${analysis.flowPatterns.upwardPercent}%` }}
                />
              </div>
              <span className="text-sm font-medium">
                {analysis.flowPatterns.upwardPercent.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card">
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="text-sm px-3 py-1 border rounded"
          >
            <option value="all">All Levels</option>
            <option value="source">Sources</option>
            <option value="intermediate">Intermediates</option>
            <option value="sink">Sinks</option>
            <option value="isolated">Isolated</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-sm px-3 py-1 border rounded"
          >
            <option value="hierarchyScore">Hierarchy Score</option>
            <option value="R_out_count">Reachable Out</option>
            <option value="R_in_count">Reachable In</option>
            <option value="V_out">Volume Out</option>
            <option value="V_in">Volume In</option>
          </select>
          
          <button
            onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
            className="text-sm px-3 py-1 border rounded hover:bg-gray-50"
          >
            {sortOrder === 'desc' ? '↓' : '↑'}
          </button>
        </div>

        {/* Node List */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {displayNodes.map((node) => {
            const profile = profiles?.[node.group.toLowerCase()];
            const nodeLevel = Object.entries(analysis.levels).find(([level, nodes]) => 
              nodes.some(n => n.group === node.group)
            )?.[0];
            
            return (
              <div
                key={node.group}
                onClick={() => handleNodeClick(node)}
                className={`p-3 border rounded-lg cursor-pointer transition-all ${
                  selectedReachabilityNode?.group === node.group
                    ? 'border-circles-purple bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      {getLevelIcon(nodeLevel)}
                      <span className="font-medium">
                        {profile?.username || formatAddress(node.group)}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">
                      {formatAddress(node.group)}
                    </span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${getLevelColor(nodeLevel)}`}>
                    {nodeLevel}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Reach Out/In:</span>
                    <span className="ml-1 font-medium">
                      {node.R_out_count}/{node.R_in_count}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Score:</span>
                    <span className="ml-1 font-medium">
                      {node.hierarchyScore.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vol Out:</span>
                    <span className="ml-1 font-medium">{formatCRC(node.V_out)}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Vol In:</span>
                    <span className="ml-1 font-medium">{formatCRC(node.V_in)}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details */}
      {selectedReachabilityNode && (
        <div className="card">
          <h3 className="font-semibold mb-3">Reachability Details</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-gray-600">Node</label>
              <p className="font-mono text-sm">{selectedReachabilityNode.group}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-600">Can Reach ({selectedReachabilityNode.R_out_count})</label>
                <div className="mt-1 max-h-32 overflow-y-auto">
                  {selectedReachabilityNode.R_out.length > 0 ? (
                    <div className="space-y-1">
                      {selectedReachabilityNode.R_out.slice(0, 10).map(node => (
                        <div key={node} className="text-xs font-mono text-gray-600">
                          {formatAddress(node)}
                        </div>
                      ))}
                      {selectedReachabilityNode.R_out.length > 10 && (
                        <div className="text-xs text-gray-500">
                          +{selectedReachabilityNode.R_out.length - 10} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">None</p>
                  )}
                </div>
              </div>
              
              <div>
                <label className="text-sm text-gray-600">Reachable From ({selectedReachabilityNode.R_in_count})</label>
                <div className="mt-1 max-h-32 overflow-y-auto">
                  {selectedReachabilityNode.R_in.length > 0 ? (
                    <div className="space-y-1">
                      {selectedReachabilityNode.R_in.slice(0, 10).map(node => (
                        <div key={node} className="text-xs font-mono text-gray-600">
                          {formatAddress(node)}
                        </div>
                      ))}
                      {selectedReachabilityNode.R_in.length > 10 && (
                        <div className="text-xs text-gray-500">
                          +{selectedReachabilityNode.R_in.length - 10} more
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500">None</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="pt-2 border-t">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Reach Ratio:</span>
                  <span className="ml-2 font-medium">{selectedReachabilityNode.reachRatio.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-gray-600">Volume Ratio:</span>
                  <span className="ml-2 font-medium">{selectedReachabilityNode.volumeRatio.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
