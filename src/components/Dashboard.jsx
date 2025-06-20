import { useEffect } from 'react';
import { useGroups, useProfiles } from '../hooks/useGroups';
import { useFlowCalculations } from '../hooks/useFlowCalculations';
import FlowGraph from './FlowGraph';
import GroupSelector from './GroupSelector';
import FlowDetails from './FlowDetails';
import LoadingStates from './LoadingStates';
import { getFlowStats } from '../services/flowCalculator';
import { formatCRC } from '../utils/formatters';

export default function Dashboard() {
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useGroups();
  const { data: flows, isLoading: flowsLoading, progress } = useFlowCalculations(groups);
  
  const addresses = groups?.map(g => g.group) || [];
  const { data: profiles } = useProfiles(addresses);
  
  const stats = flows ? getFlowStats(flows) : null;

  // Debug logging
  useEffect(() => {
    if (groups) {
      console.log('Groups loaded:', groups.length, groups);
    }
  }, [groups]);

  useEffect(() => {
    if (flows) {
      console.log('Flows loaded:', Object.keys(flows).length, flows);
      console.log('Flow stats:', stats);
    }
  }, [flows, stats]);

  if (groupsLoading) {
    return <LoadingStates.Groups />;
  }

  if (groupsError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">Error loading groups: {groupsError.message}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">
                Circles Flow Dashboard
              </h1>
              {stats && (
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span>Groups: {groups?.length || 0}</span>
                  <span>•</span>
                  <span>Flows: {stats.totalFlows}</span>
                  <span>•</span>
                  <span>Volume: {formatCRC(stats.totalVolume)} CRC</span>
                </div>
              )}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="btn-secondary flex items-center space-x-2"
            >
              <span>Refresh</span>
              <span className="text-lg">🔄</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <GroupSelector groups={groups} />
            {stats && (
              <div className="card">
                <h3 className="font-semibold mb-3">Network Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Flows:</span>
                    <span className="font-medium">{stats.totalFlows}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Volume:</span>
                    <span className="font-medium">{formatCRC(stats.totalVolume)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Average Flow:</span>
                    <span className="font-medium">{formatCRC(stats.averageFlow)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Max Flow:</span>
                    <span className="font-medium">{formatCRC(stats.maxFlow)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Graph Area */}
          <div className="lg:col-span-3">
            {flowsLoading ? (
              <LoadingStates.Flows progress={progress} />
            ) : flows && Object.keys(flows).length > 0 ? (
              <div className="card h-[600px]">
                <FlowGraph 
                  groups={groups} 
                  flows={flows} 
                  profiles={profiles}
                />
              </div>
            ) : (
              <div className="card h-[600px] flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p className="text-lg mb-2">No flows found</p>
                  <p className="text-sm">All flow calculations returned zero or failed</p>
                </div>
              </div>
            )}
            
            {/* Flow Details */}
            <div className="mt-6">
              <FlowDetails flows={flows} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}