import { create } from 'zustand';

export const useStore = create((set) => ({
  selectedNode: null,
  selectedFlow: null,
  minFlowFilter: 0,
  cyInstance: null,
  treasuryBalances: null,
  balancesLoading: false,
  
  setSelectedNode: (node) => set({ selectedNode: node }),
  setSelectedFlow: (flow) => set({ selectedFlow: flow }),
  setMinFlowFilter: (value) => set({ minFlowFilter: value }),
  setCyInstance: (cy) => set({ cyInstance: cy }),
  setTreasuryBalances: (balances) => set({ treasuryBalances: balances }),
  setBalancesLoading: (loading) => set({ balancesLoading: loading }),
  clearBalances: () => set({ treasuryBalances: null }),
}));