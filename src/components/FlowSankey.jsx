import { useRef, useEffect, useMemo } from 'react';
import * as echarts from 'echarts';
import { formatAddress, formatCRC, weiToCrc } from '../utils/formatters';

export default function FlowSankey({ transfers, source, target, treasuryBalances, flowMetrics }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  // Generate consistent color for each token
  const getTokenColor = (tokenOwner) => {
    let hash = 0;
    for (let i = 0; i < tokenOwner.length; i++) {
      hash = tokenOwner.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue = hash % 360;
    return `hsl(${hue}, 70%, 50%)`;
  };

  // Prepare Sankey data
  const sankeyData = useMemo(() => {
    if (!transfers || transfers.length === 0) return null;

    // Convert addresses to lowercase for consistency
    const normalizedTransfers = transfers.map(t => ({
      ...t,
      from: t.from.toLowerCase(),
      to: t.to.toLowerCase(),
      tokenOwner: t.tokenOwner.toLowerCase()
    }));

    // Build unique nodes
    const nodeMap = new Map();
    const addNode = (address, isSource = false) => {
      if (!nodeMap.has(address)) {
        nodeMap.set(address, {
          name: address,
          label: formatAddress(address),
          isSource
        });
      }
    };

    normalizedTransfers.forEach(transfer => {
      addNode(transfer.from, transfer.from === source?.toLowerCase());
      addNode(transfer.to);
    });

    // Create nodes array
    const nodes = Array.from(nodeMap.values()).map(node => ({
      name: node.name,
      itemStyle: {
        color: node.name === source?.toLowerCase() ? '#7B3FF2' : 
               node.name === target?.toLowerCase() ? '#10B981' : 
               '#94A3B8'
      }
    }));

    // Create links
    const links = normalizedTransfers.map((transfer, index) => ({
      source: transfer.from,
      target: transfer.to,
      value: weiToCrc(transfer.value),
      tokenOwner: transfer.tokenOwner,
      lineStyle: {
        color: getTokenColor(transfer.tokenOwner),
        opacity: 0.6,
        curveness: 0.5
      }
    }));

    return { nodes, links };
  }, [transfers, source, target]);

  useEffect(() => {
    if (!chartRef.current || !sankeyData) return;

    // Initialize or get existing chart instance
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current);
    }

    const option = {
      tooltip: {
        trigger: 'item',
        triggerOn: 'mousemove',
        formatter: function(params) {
          if (params.dataType === 'node') {
            const addr = params.data.name;
            let tooltip = `<strong>${formatAddress(addr)}</strong><br/>${addr}`;
            
            // Add balance info if this is the source node and we have balances
            if (addr === source?.toLowerCase() && treasuryBalances && flowMetrics) {
              tooltip += `<br/><br/><strong>Treasury Info:</strong><br/>`;
              tooltip += `Total Balance: ${formatCRC(flowMetrics.totalBalance)} CRC<br/>`;
              tooltip += `Flow Utilization: ${flowMetrics.flowPercentage.toFixed(1)}%`;
            }
            
            return tooltip;
          } else if (params.dataType === 'edge') {
            const link = params.data;
            return `<strong>Transfer</strong><br/>
                    Amount: ${formatCRC(link.value)} CRC<br/>
                    From: ${formatAddress(link.source)}<br/>
                    To: ${formatAddress(link.target)}<br/>
                    Token: ${formatAddress(link.tokenOwner)}`;
          }
        }
      },
      toolbox: {
        show: true,
        feature: {
          restore: { show: true, title: 'Reset' }
        },
        right: 10,
        top: 10
      },
      series: [
        {
          type: 'sankey',
          data: sankeyData.nodes,
          links: sankeyData.links,
          emphasis: {
            focus: 'adjacency'
          },
          lineStyle: {
            curveness: 0.5
          },
          label: {
            show: true,
            position: 'right',
            formatter: function(params) {
              const addr = params.data.name;
              let label = formatAddress(addr);
              
              // Add balance indicator for source node
              if (addr === source?.toLowerCase() && flowMetrics) {
                const utilization = flowMetrics.flowPercentage;
                const indicator = utilization > 75 ? '⚠️' : utilization > 25 ? '⚡' : '✅';
                label = `${indicator} ${label}`;
              }
              
              return label;
            },
            fontSize: 10,
            overflow: 'truncate',
            width: 80
          },
          itemStyle: {
            borderWidth: 1,
            borderColor: '#aaa'
          },
          nodeWidth: 12,
          nodeGap: 5,
          layoutIterations: 50,
          left: 5,
          right: 100,
          top: 10,
          bottom: 10,
          orient: 'horizontal',
          draggable: true
        }
      ]
    };

    chartInstance.current.setOption(option, true);
    
    // Ensure the chart is properly sized initially
    setTimeout(() => {
      chartInstance.current?.resize();
    }, 100);

    // Handle resize
    const handleResize = () => {
      chartInstance.current?.resize();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sankeyData, treasuryBalances, flowMetrics, source]);

  // Add ResizeObserver for better responsiveness
  useEffect(() => {
    if (!chartRef.current || !chartInstance.current) return;

    const resizeObserver = new ResizeObserver(() => {
      chartInstance.current?.resize();
    });

    resizeObserver.observe(chartRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (chartInstance.current) {
        chartInstance.current.dispose();
        chartInstance.current = null;
      }
    };
  }, []);

  if (!sankeyData) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        <p>No transfer details available for this flow.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-3">
          Flow Path Visualization
          {flowMetrics && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Using {flowMetrics.flowPercentage.toFixed(1)}% of treasury balance)
            </span>
          )}
        </h4>
        <div className="bg-white rounded border border-gray-200" style={{ position: 'relative', overflow: 'auto', maxHeight: '800px' }}>
          <div 
            ref={chartRef} 
            style={{ width: '100%', minWidth: '600px', minHeight: '400px' }}
          />
        </div>
      </div>

      {/* Transfer Details Table */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-2">Transfer Details</h4>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {transfers.map((transfer, index) => (
            <div key={index} className="bg-white border border-gray-200 p-3 rounded-lg text-sm">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-circles-purple">Transfer {index + 1}</span>
                <span className="text-circles-purple font-medium">
                  {formatCRC(weiToCrc(transfer.value))} CRC
                </span>
              </div>
              <div className="text-xs space-y-1 text-gray-600">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">From:</span>
                    <p className="font-mono truncate">{formatAddress(transfer.from)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">To:</span>
                    <p className="font-mono truncate">{formatAddress(transfer.to)}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Token:</span>
                  <p className="font-mono truncate">{formatAddress(transfer.tokenOwner)}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}