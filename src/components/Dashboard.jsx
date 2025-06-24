import { useEffect, useState, useMemo } from 'react';
import { useGroups, useProfiles, useTreasuryBalances } from '../hooks/useGroups';
import { useFlowCalculations } from '../hooks/useFlowCalculations';
import { useReachability } from '../hooks/useReachability';
import FlowGraph from './FlowGraph';
import GroupSelector from './GroupSelector';
import FlowDetails from './FlowDetails';
import HierarchyAnalysis from './HierarchyAnalysis';
import LoadingStates from './LoadingStates';
import { getFlowStats } from '../services/flowCalculator';
import { formatCRC } from '../utils/formatters';
import { useStore } from '../hooks/useStore';
import { useQueryClient } from '@tanstack/react-query';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const { minTreasuryBalance } = useStore();
  const [calculationKey, setCalculationKey] = useState(0); // Key to trigger new calculations
  const [activeTab, setActiveTab] = useState('graph'); // 'graph', 'hierarchy', 'details'
  
  const { data: groups, isLoading: groupsLoading, error: groupsError } = useGroups();
  const { data: balances, isLoading: balancesLoading } = useTreasuryBalances(groups);
  
  // Filter groups based on treasury balance - using useMemo to prevent infinite loops
  const groupsWithSufficientBalance = useMemo(() => {
    const filtered = balances?.filter(g => g.balanceCRC >= minTreasuryBalance) || [];
    console.log(`Filtering with threshold ${minTreasuryBalance} CRC:`, {
      total: balances?.length || 0,
      filtered: filtered.length,
      examples: filtered.slice(0, 5).map(g => ({ group: g.group, balance: g.balanceCRC }))
    });
    return filtered;
  }, [balances, minTreasuryBalance]);
  
  const droppedGroupsCount = (balances?.length || 0) - groupsWithSufficientBalance.length;
  
  // Use calculation key to control when to calculate
  const { data: flows, isLoading: flowsLoading, progress } = useFlowCalculations(
    groups,
    groupsWithSufficientBalance,
    calculationKey // This will trigger recalculation when changed
  );
  
  const addresses = groups?.map(g => g.group) || [];
  const { data: profiles } = useProfiles(addresses);
  
  const stats = flows ? getFlowStats(flows) : null;
  
  // Reachability analysis
  const reachabilityAnalysis = useReachability(groups, flows);

  // Handler for calculating flows
  const handleCalculateFlows = () => {
    // Clear existing flow data from cache
    queryClient.removeQueries(['flows']);
    // Increment key to trigger new calculation
    setCalculationKey(prev => prev + 1);
  };

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
                Groups Flow Visualization
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <GroupSelector 
              groups={groups} 
              totalGroups={balances?.length || 0}
              filteredGroups={groupsWithSufficientBalance.length}
            />
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
                  <hr className="my-2" />
                  <div className="flex justify-between">
                    <span>Treasury Cutoff:</span>
                    <span className="font-medium">{formatCRC(minTreasuryBalance)} CRC</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Groups Filtered:</span>
                    <span className="font-medium text-yellow-600">{droppedGroupsCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Groups:</span>
                    <span className="font-medium text-green-600">{groupsWithSufficientBalance.length}</span>
                  </div>
                </div>
              </div>
            )}
            
            {/* Calculate Flows Button */}
            {!balancesLoading && (
              <div className="card">
                <h3 className="font-semibold mb-3">Flow Calculation</h3>
                <div className="space-y-3">
                  {groupsWithSufficientBalance.length > 0 ? (
                    <>
                      <div className="text-sm text-gray-600">
                        <p>Ready to calculate flows for:</p>
                        <p className="font-medium mt-1">
                          {groupsWithSufficientBalance.length} source groups × {groups.length} target groups
                        </p>
                        <p className="text-xs mt-1">
                          ≈ {groupsWithSufficientBalance.length * (groups.length - 1)} potential flows
                        </p>
                      </div>
                      <button
                        onClick={handleCalculateFlows}
                        disabled={flowsLoading}
                        className={`w-full btn-primary ${
                          flowsLoading ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                      >
                        {flowsLoading ? `Calculating... ${Math.round(progress * 100)}%` : 'Calculate Flows'}
                      </button>
                    </>
                  ) : (
                    <div className="text-sm text-gray-500">
                      <p>No groups meet the treasury balance threshold.</p>
                      <p className="mt-2">Lower the threshold to include more groups.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Content Area with Tabs */}
          <div className="lg:col-span-3">
            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-4">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('graph')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'graph'
                      ? 'border-circles-purple text-circles-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Flow Graph
                </button>
                <button
                  onClick={() => setActiveTab('hierarchy')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'hierarchy'
                      ? 'border-circles-purple text-circles-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  disabled={!reachabilityAnalysis}
                >
                  Hierarchy Analysis
                  {reachabilityAnalysis && (
                    <span className="ml-2 text-xs bg-circles-purple text-white px-2 py-0.5 rounded-full">
                      {reachabilityAnalysis.summary.totalNodes}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'details'
                      ? 'border-circles-purple text-circles-purple'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Flow Details
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {activeTab === 'graph' && (
              <>
                {balancesLoading ? (
                  <LoadingStates.Balances />
                ) : flowsLoading ? (
                  <LoadingStates.Flows progress={progress} />
                ) : flows && Object.keys(flows).length > 0 ? (
                  <div className="card h-[600px]">
                    <FlowGraph 
                      groups={groups} 
                      flows={flows} 
                      profiles={profiles}
                      balances={balances}
                      reachabilityAnalysis={reachabilityAnalysis}
                    />
                  </div>
                ) : (
                  <div className="card h-[600px] flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      {calculationKey === 0 ? (
                        <>
                          <p className="text-lg mb-2">No flows calculated yet</p>
                          <p className="text-sm mb-4">
                            Configure your filters and click "Calculate Flows" to start
                          </p>
                          {groupsWithSufficientBalance.length === 0 && (
                            <p className="text-sm text-yellow-600">
                              Note: No groups meet the current treasury balance threshold of {formatCRC(minTreasuryBalance)} CRC
                            </p>
                          )}
                        </>
                      ) : (
                        <>
                          <p className="text-lg mb-2">No flows found</p>
                          <p className="text-sm">
                            All flow calculations returned zero or failed
                          </p>
                          <p className="text-xs mt-2 text-gray-400">
                            Try adjusting the treasury balance threshold
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'hierarchy' && (
              <HierarchyAnalysis 
                analysis={reachabilityAnalysis}
                profiles={profiles}
              />
            )}

            {activeTab === 'details' && (
              <FlowDetails flows={flows} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}