import { useStore } from '../hooks/useStore';
import { formatCRC } from '../utils/formatters';

export default function GroupSelector({ groups }) {
  const { minFlowFilter, setMinFlowFilter } = useStore();

  return (
    <div className="card">
      <h3 className="font-semibold mb-4">Filters</h3>
      
      {/* Min Flow Filter */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">
          Minimum Flow: {formatCRC(minFlowFilter)} CRC
        </label>
        <input
          type="range"
          min="0"
          max="10000"
          step="100"
          value={minFlowFilter}
          onChange={(e) => setMinFlowFilter(Number(e.target.value))}
          className="w-full"
        />
      </div>
    </div>
  );
}