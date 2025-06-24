import { create } from 'zustand';

export const useStore = create((set) => ({
  selectedNode: null,
  selectedFlow: null,
  minFlowFilter: 0,
  minTreasuryBalance: 1000, // Default 1000 CRC minimum
  cyInstance: null,
  treasuryBalances: null,
  balancesLoading: false,
  layoutType: 'fcose', // Default layout
  
  // Reachability analysis data
  reachabilityAnalysis: null,
  reachabilityLoading: false,
  selectedReachabilityNode: null,
  hierarchyViewMode: 'score', // 'score', 'level', 'volume'
  
  // Actions
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedFlow: (flow) => set({ selectedFlow: flow }),
  setMinFlowFilter: (value) => set({ minFlowFilter: value }),
  setMinTreasuryBalance: (value) => set({ minTreasuryBalance: value }),
  setCyInstance: (cy) => set({ cyInstance: cy }),
  setTreasuryBalances: (balances) => set({ treasuryBalances: balances }),
  setBalancesLoading: (loading) => set({ balancesLoading: loading }),
  clearBalances: () => set({ treasuryBalances: null }),
  setLayoutType: (type) => set({ layoutType: type }),
  
  // Reachability actions
  setReachabilityAnalysis: (analysis) => set({ reachabilityAnalysis: analysis }),
  setReachabilityLoading: (loading) => set({ reachabilityLoading: loading }),
  setSelectedReachabilityNode: (node) => set({ selectedReachabilityNode: node }),
  setHierarchyViewMode: (mode) => set({ hierarchyViewMode: mode }),
}));