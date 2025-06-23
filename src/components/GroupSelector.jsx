import { useStore } from '../hooks/useStore';
import { formatCRC } from '../utils/formatters';

export default function GroupSelector({ groups, totalGroups, filteredGroups }) {
  const { minFlowFilter, setMinFlowFilter, minTreasuryBalance, setMinTreasuryBalance, layoutType, setLayoutType } = useStore();

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Filters & Settings</h3>
      
      {/* Treasury Balance Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Min Treasury Balance (CRC)
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={minTreasuryBalance}
          onChange={(e) => setMinTreasuryBalance(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circles-purple"
          placeholder="Enter minimum balance"
        />
        <div className="mt-2 text-xs text-gray-600">
          {filteredGroups} of {totalGroups} groups above threshold
          {totalGroups - filteredGroups > 0 && (
            <span className="text-yellow-600 block">
              ({totalGroups - filteredGroups} groups filtered out)
            </span>
          )}
        </div>
      </div>
      
      {/* Min Flow Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Minimum Flow (CRC)
        </label>
        <input
          type="number"
          min="0"
          step="100"
          value={minFlowFilter}
          onChange={(e) => setMinFlowFilter(Number(e.target.value) || 0)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circles-purple"
          placeholder="Enter minimum flow"
        />
      </div>

      {/* Layout Type Selector */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Graph Layout
        </label>
        <select
          value={layoutType}
          onChange={(e) => setLayoutType(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-circles-purple"
        >
          <option value="fcose">Force-Directed (Default)</option>
          <option value="cose">Spring Layout</option>
          <option value="grid">Grid Layout</option>
          <option value="dagre">Hierarchical DAG</option>
          <option value="breadthfirst">Tree Layout</option>
          <option value="concentric">Concentric Circles</option>
        </select>
      </div>
    </div>
  );
}