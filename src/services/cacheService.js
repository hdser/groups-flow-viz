class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  get(key, subKey = null) {
    const cacheKey = subKey ? `${key}:${subKey}` : key;
    const timestamp = this.timestamps.get(cacheKey);
    
    if (!timestamp) return null;
    
    const age = Date.now() - timestamp;
    const ttl = this.getTTL(key);
    
    if (age > ttl) {
      this.delete(cacheKey);
      return null;
    }
    
    return this.cache.get(cacheKey);
  }

  set(key, subKey, value, ttl = null) {
    const cacheKey = subKey ? `${key}:${subKey}` : key;
    this.cache.set(cacheKey, value);
    this.timestamps.set(cacheKey, Date.now());
  }

  delete(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
  }

  clear() {
    this.cache.clear();
    this.timestamps.clear();
  }

  getTTL(key) {
    const ttlMap = {
      groups: 5 * 60 * 1000, // 5 minutes
      flows: 60 * 1000, // 1 minute
      profiles: 60 * 60 * 1000, // 1 hour
      balances: 0 * 60 * 1000 // 2 minutes for balance data
    };
    return ttlMap[key] || 60 * 1000;
  }
}

export default new CacheService();