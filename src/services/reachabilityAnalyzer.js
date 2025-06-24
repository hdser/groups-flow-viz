import { weiToCrc } from '../utils/formatters';

class ReachabilityAnalyzer {
  constructor() {
    this.adjacencyList = new Map();
    this.reverseAdjacencyList = new Map();
    this.flowVolumes = new Map();
    this.reachabilityCache = new Map();
  }

  /**
   * Build adjacency lists from flows data
   * @param {Object} flows - The flows object from flow calculator
   * @param {Array} groups - All groups
   */
  buildGraph(flows, groups) {
    // Clear previous data
    this.adjacencyList.clear();
    this.reverseAdjacencyList.clear();
    this.flowVolumes.clear();
    this.reachabilityCache.clear();

    // Initialize all nodes
    groups.forEach(group => {
      this.adjacencyList.set(group.group, new Set());
      this.reverseAdjacencyList.set(group.group, new Set());
      this.flowVolumes.set(group.group, { out: new Map(), in: new Map() });
    });

    // Build adjacency lists and track volumes
    Object.entries(flows).forEach(([key, flow]) => {
      if (!flow || flow.maxFlow === '0') return;

      const { fromGroup, toGroup, maxFlowCrc } = flow;
      const volume = parseFloat(maxFlowCrc || 0);

      if (volume > 0) {
        // Forward adjacency
        this.adjacencyList.get(fromGroup)?.add(toGroup);
        
        // Reverse adjacency
        this.reverseAdjacencyList.get(toGroup)?.add(fromGroup);

        // Track volumes
        const fromVolumes = this.flowVolumes.get(fromGroup);
        const toVolumes = this.flowVolumes.get(toGroup);
        
        if (fromVolumes) {
          fromVolumes.out.set(toGroup, volume);
        }
        if (toVolumes) {
          toVolumes.in.set(fromGroup, volume);
        }
      }
    });

    console.log(`Built graph with ${groups.length} nodes and ${Object.keys(flows).length} edges`);
  }

  /**
   * Compute reachability set using BFS
   * @param {string} startNode - Starting node
   * @param {Map} adjacencyList - Which adjacency list to use
   * @returns {Set} Set of reachable nodes
   */
  computeReachabilitySet(startNode, adjacencyList) {
    const cacheKey = `${startNode}_${adjacencyList === this.adjacencyList ? 'out' : 'in'}`;
    
    if (this.reachabilityCache.has(cacheKey)) {
      return this.reachabilityCache.get(cacheKey);
    }

    const visited = new Set();
    const queue = [startNode];
    visited.add(startNode);

    while (queue.length > 0) {
      const current = queue.shift();
      const neighbors = adjacencyList.get(current) || new Set();

      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push(neighbor);
        }
      }
    }

    // Remove the start node from the result
    visited.delete(startNode);
    
    this.reachabilityCache.set(cacheKey, visited);
    return visited;
  }

  /**
   * Compute reachability metrics for a single node
   * @param {string} node - Node to analyze
   * @returns {Object} Reachability metrics
   */
  computeNodeReachability(node) {
    const R_out = this.computeReachabilitySet(node, this.adjacencyList);
    const R_in = this.computeReachabilitySet(node, this.reverseAdjacencyList);

    const volumes = this.flowVolumes.get(node) || { out: new Map(), in: new Map() };
    
    // Calculate total volumes
    const V_out = Array.from(volumes.out.values()).reduce((sum, v) => sum + v, 0);
    const V_in = Array.from(volumes.in.values()).reduce((sum, v) => sum + v, 0);

    // Calculate reachable volumes (sum of volumes to/from reachable nodes)
    let reachableVolumeOut = 0;
    let reachableVolumeIn = 0;

    // For outgoing reachable volume, we need to consider transitive flows
    for (const reachableNode of R_out) {
      const pathVolume = this.findMaxFlowPath(node, reachableNode);
      reachableVolumeOut += pathVolume;
    }

    // For incoming reachable volume
    for (const reachableNode of R_in) {
      const pathVolume = this.findMaxFlowPath(reachableNode, node);
      reachableVolumeIn += pathVolume;
    }

    return {
      node,
      R_out: Array.from(R_out),
      R_in: Array.from(R_in),
      R_out_count: R_out.size,
      R_in_count: R_in.size,
      V_out,
      V_in,
      V_out_reachable: reachableVolumeOut,
      V_in_reachable: reachableVolumeIn,
      direct_out_count: (this.adjacencyList.get(node) || new Set()).size,
      direct_in_count: (this.reverseAdjacencyList.get(node) || new Set()).size
    };
  }

  /**
   * Find maximum flow along any path from source to target
   * @param {string} source - Source node
   * @param {string} target - Target node
   * @returns {number} Maximum flow value
   */
  findMaxFlowPath(source, target) {
    if (source === target) return 0;

    // Check direct connection first
    const directVolume = this.flowVolumes.get(source)?.out.get(target) || 0;
    if (directVolume > 0) return directVolume;

    // BFS to find path with maximum flow
    const visited = new Set();
    const queue = [{ node: source, minFlow: Infinity }];
    let maxFlow = 0;

    while (queue.length > 0) {
      const { node: current, minFlow } = queue.shift();
      
      if (visited.has(current)) continue;
      visited.add(current);

      const neighbors = this.adjacencyList.get(current) || new Set();
      
      for (const neighbor of neighbors) {
        const edgeFlow = this.flowVolumes.get(current)?.out.get(neighbor) || 0;
        const pathFlow = Math.min(minFlow, edgeFlow);

        if (neighbor === target) {
          maxFlow = Math.max(maxFlow, pathFlow);
        } else if (!visited.has(neighbor)) {
          queue.push({ node: neighbor, minFlow: pathFlow });
        }
      }
    }

    return maxFlow;
  }

  /**
   * Compute hierarchy scores for all nodes
   * @param {Array} groups - All groups
   * @returns {Array} Nodes with hierarchy scores
   */
  computeHierarchyScores(groups) {
    const results = [];

    for (const group of groups) {
      const reachability = this.computeNodeReachability(group.group);
      
      // Compute ratios (add 1 to avoid division by zero)
      const reachRatio = reachability.R_out_count / (reachability.R_in_count + 1);
      const volumeRatio = reachability.V_out / (reachability.V_in + 1);
      
      // Compute centrality score (simplified betweenness)
      const centralityScore = (reachability.R_out_count * reachability.R_in_count) / 
                            (groups.length * groups.length);

      // Weighted hierarchy score
      const hierarchyScore = 
        0.4 * reachRatio + 
        0.4 * volumeRatio + 
        0.2 * centralityScore;

      results.push({
        ...reachability,
        reachRatio,
        volumeRatio,
        centralityScore,
        hierarchyScore,
        group: group.group,
        treasury: group.treasury,
        mintHandler: group.mintHandler
      });
    }

    return results;
  }

  /**
   * Classify nodes into hierarchical levels
   * @param {Array} scoredNodes - Nodes with hierarchy scores
   * @returns {Object} Level classification
   */
  classifyLevels(scoredNodes) {
    const levels = {
      source: [],      // Nodes that only send (R_out > 0, R_in = 0)
      intermediate: [], // Nodes that both send and receive
      sink: [],        // Nodes that only receive (R_out = 0, R_in > 0)
      isolated: []     // No connections
    };

    // First, classify based on actual flow patterns
    scoredNodes.forEach(node => {
      if (node.R_out_count === 0 && node.R_in_count === 0) {
        levels.isolated.push(node);
      } else if (node.R_out_count > 0 && node.R_in_count === 0) {
        // Pure source - only sends
        levels.source.push(node);
      } else if (node.R_out_count === 0 && node.R_in_count > 0) {
        // Pure sink - only receives
        levels.sink.push(node);
      } else {
        // Has both in and out connections
        levels.intermediate.push(node);
      }
    });

    // If we have very few intermediates but many sources/sinks, 
    // reclassify based on hierarchy scores
    const connectedNodes = scoredNodes.filter(n => n.R_out_count > 0 || n.R_in_count > 0);
    
    if (levels.intermediate.length < connectedNodes.length * 0.1 && connectedNodes.length > 10) {
      // Reset and use score-based classification
      levels.source = [];
      levels.intermediate = [];
      levels.sink = [];
      
      const sorted = [...connectedNodes].sort((a, b) => b.hierarchyScore - a.hierarchyScore);
      const topThird = Math.floor(sorted.length / 3);
      const bottomThird = Math.floor(sorted.length * 2 / 3);
      
      sorted.forEach((node, index) => {
        if (index < topThird) {
          levels.source.push(node);
        } else if (index < bottomThird) {
          levels.intermediate.push(node);
        } else {
          levels.sink.push(node);
        }
      });
    }

    return levels;
  }

  /**
   * Analyze flow patterns between hierarchical levels
   * @param {Object} levels - Level classification
   * @returns {Object} Flow pattern analysis
   */
  analyzeFlowPatterns(levels) {
    const patterns = {
      downward: 0,  // source -> intermediate/sink
      upward: 0,    // sink -> intermediate/source
      lateral: 0,   // within same level
      total: 0
    };

    // Create level map for quick lookup
    const nodeLevel = new Map();
    Object.entries(levels).forEach(([level, nodes]) => {
      nodes.forEach(node => nodeLevel.set(node.group, level));
    });

    // Analyze each edge
    this.adjacencyList.forEach((targets, source) => {
      const sourceLevel = nodeLevel.get(source);
      
      targets.forEach(target => {
        const targetLevel = nodeLevel.get(target);
        const volume = this.flowVolumes.get(source)?.out.get(target) || 0;
        
        patterns.total += volume;

        if (sourceLevel === targetLevel) {
          patterns.lateral += volume;
        } else if (
          (sourceLevel === 'source' && targetLevel !== 'source') ||
          (sourceLevel === 'intermediate' && targetLevel === 'sink')
        ) {
          patterns.downward += volume;
        } else {
          patterns.upward += volume;
        }
      });
    });

    return {
      ...patterns,
      downwardPercent: (patterns.downward / patterns.total) * 100,
      upwardPercent: (patterns.upward / patterns.total) * 100,
      lateralPercent: (patterns.lateral / patterns.total) * 100
    };
  }

  /**
   * Find strongly connected components
   * @returns {Array} Array of component arrays
   */
  findStronglyConnectedComponents() {
    const visited = new Set();
    const stack = [];
    const components = [];

    // First DFS to fill stack
    const dfs1 = (node) => {
      visited.add(node);
      const neighbors = this.adjacencyList.get(node) || new Set();
      
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs1(neighbor);
        }
      }
      
      stack.push(node);
    };

    // Run DFS on all nodes
    this.adjacencyList.forEach((_, node) => {
      if (!visited.has(node)) {
        dfs1(node);
      }
    });

    // Second DFS on reverse graph
    visited.clear();
    
    const dfs2 = (node, component) => {
      visited.add(node);
      component.push(node);
      
      const neighbors = this.reverseAdjacencyList.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          dfs2(neighbor, component);
        }
      }
    };

    // Process nodes in reverse topological order
    while (stack.length > 0) {
      const node = stack.pop();
      if (!visited.has(node)) {
        const component = [];
        dfs2(node, component);
        if (component.length > 1) {
          components.push(component);
        }
      }
    }

    return components;
  }

  /**
   * Get complete analysis for all nodes
   * @param {Array} groups - All groups
   * @param {Object} flows - Flow data
   * @returns {Object} Complete analysis results
   */
  analyzeNetwork(groups, flows) {
    // Build the graph
    this.buildGraph(flows, groups);

    // Compute hierarchy scores
    const hierarchyScores = this.computeHierarchyScores(groups);

    // Classify into levels
    const levels = this.classifyLevels(hierarchyScores);

    // Analyze flow patterns
    const flowPatterns = this.analyzeFlowPatterns(levels);

    // Find strongly connected components
    const components = this.findStronglyConnectedComponents();

    return {
      nodes: hierarchyScores,
      levels,
      flowPatterns,
      stronglyConnectedComponents: components,
      summary: {
        totalNodes: groups.length,
        totalEdges: Object.keys(flows).length,
        sourcesCount: levels.source.length,
        intermediatesCount: levels.intermediate.length,
        sinksCount: levels.sink.length,
        isolatedCount: levels.isolated.length,
        componentsCount: components.length,
        largestComponentSize: Math.max(...components.map(c => c.length), 0)
      }
    };
  }
}

export default new ReachabilityAnalyzer();