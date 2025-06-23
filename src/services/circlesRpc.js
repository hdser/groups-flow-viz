import { API_ENDPOINT, BATCH_SIZE } from '../utils/constants';
import { chunk, delay } from '../utils/helpers';
import cacheService from './cacheService';

export const fetchGroups = async () => {
  // Check cache first
  const cached = cacheService.get('groups');
  if (cached) return cached;

  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "circles_query",
    params: [{
      Namespace: "V_CrcV2",
      Table: "Groups",
      Columns: ["group", "mintHandler", "treasury"],
      Filter: [{
        Type: "FilterPredicate",
        FilterType: "IsNotNull",
        Column: "mintHandler",
        Value: "undefined"
      }],
      Order: []
    }]
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    // Transform the rows/columns format to array of objects
    const result = data.result;
    if (!result || !result.rows || !result.columns) {
      throw new Error('Invalid response format');
    }

    const groups = result.rows.map(row => {
      const obj = {};
      result.columns.forEach((column, index) => {
        obj[column] = row[index];
      });
      return obj;
    });
    
    console.log(`Loaded ${groups.length} groups`);
    
    // Cache the results
    cacheService.set('groups', null, groups);
    
    return groups;
  } catch (error) {
    console.error('Error fetching groups:', error);
    throw error;
  }
};


export const getTreasuryBalance = async (treasuryAddress) => {
  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "circlesV2_getTotalBalance",
    params: [treasuryAddress.toLowerCase(), true]
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      console.error(`Error fetching balance for ${treasuryAddress}:`, data.error);
      return null;
    }

    // The result is the balance string directly
    return data.result;
  } catch (error) {
    console.error(`Error fetching balance for ${treasuryAddress}:`, error);
    return null;
  }
};

// Batch get treasury balances
export const batchGetTreasuryBalances = async (groups) => {
  if (!groups || groups.length === 0) return [];

  const balances = [];
  const batches = chunk(groups, BATCH_SIZE);

  console.log(`Fetching treasury balances for ${groups.length} groups...`);

  for (const batch of batches) {
    const batchPromises = batch.map(async (group) => {
      // Use the treasury address for this specific group
      const treasuryAddress = group.treasury.toLowerCase();
      const cached = cacheService.get('treasuryBalances', treasuryAddress);
      
      if (cached) {
        return { ...group, ...cached };
      }

      const result = await getTreasuryBalance(treasuryAddress);
      
      if (result) {
        // Convert the balance string to CRC
        const balanceCRC = parseFloat(result);
        const balanceData = {
          totalBalance: result,
          balanceCRC: balanceCRC
        };
        
        console.log(`Treasury ${treasuryAddress} balance: ${balanceCRC} CRC`);
        
        cacheService.set('treasuryBalances', treasuryAddress, balanceData);
        return { ...group, ...balanceData };
      }
      
      return { ...group, totalBalance: '0', balanceCRC: 0 };
    });

    const batchResults = await Promise.all(batchPromises);
    balances.push(...batchResults);

    // Small delay between batches
    await delay(100);
  }

  // Log balance distribution
  const balanceRanges = {
    '0': 0,
    '1-100': 0,
    '100-1000': 0,
    '1000-10000': 0,
    '10000+': 0
  };
  
  balances.forEach(b => {
    if (b.balanceCRC === 0) balanceRanges['0']++;
    else if (b.balanceCRC < 100) balanceRanges['1-100']++;
    else if (b.balanceCRC < 1000) balanceRanges['100-1000']++;
    else if (b.balanceCRC < 10000) balanceRanges['1000-10000']++;
    else balanceRanges['10000+']++;
  });
  
  console.log(`Fetched balances for ${balances.length} treasuries. Distribution:`, balanceRanges);
  return balances;
};

export const fetchTreasuryBalances = async (treasuryAddress) => {
  // Check cache first
  const cached = cacheService.get('balances', treasuryAddress.toLowerCase());
  if (cached) return cached;

  const requestBody = {
    jsonrpc: "2.0",
    id: 1,
    method: "circles_query",
    params: [{
      Namespace: "V_CrcV2",
      Table: "BalancesByAccountAndToken",
      Columns: ["tokenAddress", "demurragedTotalBalance"],
      Filter: [{
        Type: "FilterPredicate",
        FilterType: "Equals",
        Column: "account",
        Value: treasuryAddress.toLowerCase()
      }],
      Order: []
    }]
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balances: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error.message || 'RPC error');
    }

    // Transform the rows/columns format to array of objects
    const result = data.result;
    if (!result || !result.rows || !result.columns) {
      throw new Error('Invalid response format');
    }

    const balances = result.rows.map(row => {
      const obj = {};
      result.columns.forEach((column, index) => {
        obj[column] = row[index];
      });
      return obj;
    });
    
    console.log(`Loaded ${balances.length} token balances for treasury ${treasuryAddress}`);
    
    // Cache the results
    cacheService.set('balances', treasuryAddress.toLowerCase(), balances);
    
    return balances;
  } catch (error) {
    console.error('Error fetching treasury balances:', error);
    throw error;
  }
};

export const findPath = async (from, to, amount = "10000000000000000000000000000") => {
  const requestBody = {
    jsonrpc: "2.0",
    id: 0,
    method: "circlesV2_findPath",
    params: [{
      Source: from,
      Sink: to,
      TargetFlow: amount,
      WithWrap: true
    }]
  };

  try {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    
    if (data.error) {
      return null;
    }

    return data.result;
  } catch (error) {
    console.error(`Error finding path from ${from} to ${to}:`, error);
    return null;
  }
};

export const batchFindPaths = async (pairs, onProgress) => {
  const results = {};
  const batches = chunk(pairs, BATCH_SIZE);
  let completed = 0;

  console.log(`Starting to calculate ${pairs.length} flows in ${batches.length} batches`);

  for (const batch of batches) {
    const batchPromises = batch.map(async (pair) => {
      const cacheKey = `flow:${pair.key}`;
      const cached = cacheService.get('flows', pair.key);
      
      if (cached) {
        return { key: pair.key, result: cached };
      }

      const result = await findPath(pair.from, pair.to);
      
      if (result && result.maxFlow && result.maxFlow !== '0') {
        const flowData = {
          ...result,
          fromGroup: pair.fromGroup,
          toGroup: pair.toGroup,
          maxFlowCrc: weiToCrc(result.maxFlow),
          sourceBalance: pair.sourceBalance,
          transfers: result.transfers || []
        };
        
        console.log(`Found flow: ${pair.fromGroup} -> ${pair.toGroup}: ${flowData.maxFlowCrc} CRC`);
        
        cacheService.set('flows', pair.key, flowData);
        return { key: pair.key, result: flowData };
      }
      
      return { key: pair.key, result: null };
    });

    const batchResults = await Promise.all(batchPromises);
    
    batchResults.forEach(({ key, result }) => {
      if (result) {
        results[key] = result;
      }
    });

    completed += batch.length;
    if (onProgress) {
      onProgress(completed / pairs.length);
    }

    // Small delay between batches to avoid overwhelming the RPC
    await delay(500);
  }

  console.log(`Completed flow calculations. Found ${Object.keys(results).length} non-zero flows out of ${pairs.length} attempts`);
  return results;
};

export const fetchProfiles = async (addresses) => {
  const uniqueAddresses = [...new Set(addresses.map(a => a.toLowerCase()))];
  const profiles = {};
  
  // Check cache for each address
  const toFetch = [];
  uniqueAddresses.forEach(addr => {
    const cached = cacheService.get('profiles', addr);
    if (cached) {
      profiles[addr] = cached;
    } else {
      toFetch.push(addr);
    }
  });

  if (toFetch.length === 0) return profiles;

  // For now, return mock profiles - replace with actual profile fetching
  toFetch.forEach(addr => {
    const mockProfile = {
      address: addr,
      username: null,
      avatarUrl: null
    };
    
    profiles[addr] = mockProfile;
    cacheService.set('profiles', addr, mockProfile);
  });

  return profiles;
};

// Helper function from formatters
const weiToCrc = (wei) => {
  try {
    const weiStr = wei.toString();
    if (weiStr.length <= 18) {
      return parseFloat(`0.${weiStr.padStart(18, '0')}`);
    }
    const whole = weiStr.slice(0, -18);
    const fraction = weiStr.slice(-18);
    return parseFloat(`${whole}.${fraction}`);
  } catch (error) {
    console.error('Error converting wei to CRC:', error);
    return 0;
  }
};