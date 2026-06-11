import { Redis } from "@upstash/redis";

const UPSTASH_REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let redis = null;

function createClient() {
  if (!UPSTASH_REDIS_URL || !UPSTASH_REDIS_TOKEN) {
    console.warn("Upstash Redis credentials missing — running without Redis cache");
    return null;
  }
  return new Redis({
    url: UPSTASH_REDIS_URL,
    token: UPSTASH_REDIS_TOKEN,
    automaticDeserialization: false,
  });
}

export function getUpstashClient() {
  if (!redis) {
    redis = createClient();
  }
  return redis;
}

/** For testing only — inject a mock Redis client */
export function __setMockClient(mock) {
  redis = mock;
}

export async function withRedisFallback(fn, fallback) {
  const client = getUpstashClient();
  if (!client) return fallback();
  try {
    return await fn(client);
  } catch (err) {
    console.warn("Upstash Redis operation failed, using fallback:", err.message);
    return fallback();
  }
}
