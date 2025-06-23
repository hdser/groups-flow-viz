import { useEffect } from 'react';
import { useStore } from '../hooks/useStore';
import { formatAddress, formatCRC, weiToCrc } from '../utils/formatters';
import { fetchTreasuryBalances } from '../services/circlesRpc';
import FlowSankey from './FlowSankey';
import toast from 'react-hot-toast';

export default function FlowDetails({ flows }) {
  const { 
    selectedNode, 
    selectedFlow, 
    treasuryBalances, 
    setTreasuryBalances, 
    balancesLoading, 
    setBalancesLoading 
  } = useStore();

  // Fetch treasury balances when a flow is selected
  useEffect(() => {
    if (!selectedFlow || !selectedFlow.sourceTreasury) return;

    const loadBalances = async () => {
      setBalancesLoading(true);
      try {
        const balances = await fetchTreasuryBalances(selectedFlow.sourceTreasury);
        setTreasuryBalances(balances);
      } catch (error) {
        console.error('Failed to fetch treasury balances:', error);
        toast.error('Failed to load treasury balances');
        setTreasuryBalances(null);
      } finally {
        setBalancesLoading(false);
      }
    };

    loadBalances();
  }, [selectedFlow, setTreasuryBalances, setBalancesLoading]);

  // Calculate total balance and flow percentage
  const calculateFlowMetrics = () => {
    if (!treasuryBalances || !selectedFlow) return null;

    const totalBalance = treasuryBalances.reduce((sum, balance) => {
      return sum + weiToCrc(balance.demurragedTotalBalance);
    }, 0);

    const flowAmount = selectedFlow.maxFlowCrc || selectedFlow.flow;
    const flowPercentage = totalBalance > 0 ? (flowAmount / totalBalance) * 100 : 0;

    return {
      totalBalance,
      flowAmount,
      flowPercentage
    };
  };

  if (!selectedNode && !selectedFlow) {
    return (
      <div className="card text-center text-gray-500">
        <p>Click on a node or edge to see details</p>
      </div>
    );
  }

  if (selectedNode) {
    return (
      <div className="card">
        <h3 className="font-semibold mb-4">Group Details</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-gray-600">Group Address</label>
            <p className="font-mono text-sm">{selectedNode.id}</p>
          </div>
          
          {selectedNode.profile?.username && (
            <div>
              <label className="text-sm text-gray-600">Username</label>
              <p className="font-medium">{selectedNode.profile.username}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm text-gray-600">Treasury</label>
            <p className="font-mono text-sm">{formatAddress(selectedNode.treasury)}</p>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Mint Handler</label>
            <p className="font-mono text-sm">{formatAddress(selectedNode.mintHandler)}</p>
          </div>
          
          {selectedNode.balance !== undefined && (
            <div>
              <label className="text-sm text-gray-600">Treasury Balance</label>
              <p className={`font-medium text-lg ${
                selectedNode.balance === 0 ? 'text-gray-500' :
                selectedNode.balance < 100 ? 'text-yellow-600' :
                selectedNode.balance > 10000 ? 'text-green-600' :
                'text-circles-purple'
              }`}>
                {formatCRC(selectedNode.balance)} CRC
              </p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">Total Inflow</label>
              <p className="font-medium text-green-600">{formatCRC(selectedNode.totalIn)} CRC</p>
            </div>
            <div>
              <label className="text-sm text-gray-600">Total Outflow</label>
              <p className="font-medium text-red-600">{formatCRC(selectedNode.totalOut)} CRC</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedFlow) {
    const transfers = selectedFlow.transfers || [];
    const metrics = calculateFlowMetrics();
    
    // Calculate token usage from source treasury
    const calculateTokenUsage = () => {
      if (!transfers || transfers.length === 0 || !treasuryBalances) return {};
      
      const sourceTreasury = selectedFlow.sourceTreasury.toLowerCase();
      const tokenUsage = {};
      
      // Find all transfers that originate from the source treasury
      transfers.forEach(transfer => {
        if (transfer.from.toLowerCase() === sourceTreasury) {
          const tokenOwner = transfer.tokenOwner.toLowerCase();
          if (!tokenUsage[tokenOwner]) {
            tokenUsage[tokenOwner] = BigInt(0);
          }
          tokenUsage[tokenOwner] += BigInt(transfer.value);
        }
      });
      
      return tokenUsage;
    };
    
    const tokenUsage = calculateTokenUsage();
    
    return (
      <div className="card">
        <h3 className="font-semibold mb-4">Flow Path Details</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600">From Group</label>
              <p className="font-mono text-sm">{selectedFlow.fromGroup || selectedFlow.source}</p>
              {selectedFlow.sourceBalance !== undefined && (
                <p className="text-xs text-gray-500 mt-1">
                  Balance: {formatCRC(selectedFlow.sourceBalance)} CRC
                </p>
              )}
            </div>
            <div>
              <label className="text-sm text-gray-600">To Group</label>
              <p className="font-mono text-sm">{selectedFlow.toGroup || selectedFlow.target}</p>
            </div>
          </div>
          
          <div>
            <label className="text-sm text-gray-600">Max Flow</label>
            <p className="font-medium text-2xl text-circles-purple">
              {formatCRC(selectedFlow.maxFlowCrc || selectedFlow.flow)} CRC
            </p>
          </div>

          {/* Treasury Balance Information */}
          {balancesLoading ? (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Loading treasury balances...</p>
            </div>
          ) : metrics && treasuryBalances ? (
            <div className="bg-gray-50 p-4 rounded-lg space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Treasury Analysis</h4>
              
              {/* Summary of token usage */}
              {transfers && transfers.length > 0 && (
                <div className="text-xs text-gray-600 mb-2">
                  {(() => {
                    const usedTokens = Object.keys(tokenUsage).length;
                    return `Using ${usedTokens} of ${treasuryBalances.length} available tokens in treasury`;
                  })()}
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-500">Total Treasury Balance</label>
                  <p className="font-medium text-lg">{formatCRC(metrics.totalBalance)} CRC</p>
                </div>
                <div>
                  <label className="text-xs text-gray-500">Flow Utilization</label>
                  <p className={`font-medium text-lg ${
                    metrics.flowPercentage > 75 ? 'text-red-600' : 
                    metrics.flowPercentage > 25 ? 'text-yellow-600' : 
                    'text-green-600'
                  }`}>
                    {metrics.flowPercentage.toFixed(1)}%
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-500 mb-2 block">Token Balances ({treasuryBalances.length} tokens)</label>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {treasuryBalances.map((balance, index) => {
                    // Calculate how much of this token is used in the flow
                    const tokenAddress = balance.tokenAddress.toLowerCase();
                    const tokenUsedWei = tokenUsage[tokenAddress] || BigInt(0);
                    const tokenUsedCrc = weiToCrc(tokenUsedWei.toString());
                    const tokenBalance = weiToCrc(balance.demurragedTotalBalance);
                    const usagePercentage = tokenBalance > 0 ? (tokenUsedCrc / tokenBalance) * 100 : 0;
                    
                    return (
                      <div key={index} className="bg-gray-50 p-2 rounded border border-gray-200">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-mono text-xs text-gray-600 break-all">{balance.tokenAddress}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500">Balance:</span>
                            <p className="font-medium">{formatCRC(tokenBalance)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Used:</span>
                            <p className="font-medium">{formatCRC(tokenUsedCrc)}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">Usage:</span>
                            <p className={`font-medium ${
                              usagePercentage > 75 ? 'text-red-600' : 
                              usagePercentage > 25 ? 'text-yellow-600' : 
                              usagePercentage > 0 ? 'text-green-600' :
                              'text-gray-400'
                            }`}>
                              {usagePercentage.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null}

          {transfers.length > 0 ? (
            <FlowSankey 
              transfers={transfers} 
              source={selectedFlow.fromGroup || selectedFlow.source}
              target={selectedFlow.toGroup || selectedFlow.target}
              treasuryBalances={treasuryBalances}
              flowMetrics={metrics}
            />
          ) : (
            <div className="text-sm text-gray-500">
              <p>No detailed path information available for this flow.</p>
              <p className="text-xs mt-1">Click on a different edge to see its path details.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}