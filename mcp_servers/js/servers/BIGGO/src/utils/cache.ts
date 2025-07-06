import NodeCache from "node-cache";

// Cache for 1 hour (3600 seconds)
export const cache = new NodeCache({ stdTTL: 3600 });

// Helper function to generate cache keys
export function generateCacheKey(prefix: string, ...params: any[]): string {
  return `${prefix}:${params.join(':')}`;
}

// Helper function to get cached data or set new data
export async function getCachedOrFetch<T>(
  cacheKey: string,
  fetchFunction: () => Promise<T>
): Promise<T> {
  const cachedResult = cache.get<T>(cacheKey);
  if (cachedResult) {
    return cachedResult;
  }

  const result = await fetchFunction();
  cache.set(cacheKey, result);
  return result;
} 