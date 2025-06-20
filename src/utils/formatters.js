export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export const formatCRC = (amount) => {
  if (!amount) return '0';
  const num = parseFloat(amount);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(2)}M`;
  } else if (num >= 1000) {
    return `${(num / 1000).toFixed(2)}K`;
  }
  return num.toFixed(2);
};

export const weiToCrc = (wei) => {
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

export const getGroupLabel = (address, profile) => {
  if (profile?.username) {
    return profile.username;
  }
  return formatAddress(address);
};