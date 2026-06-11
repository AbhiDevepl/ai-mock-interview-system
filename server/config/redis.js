import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
let redisClient = null;

function createClient() {
  const client = new Redis(REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      if (times > 3) {
        console.warn("Redis max retries reached, giving up");
        return null;
      }
      return Math.min(times * 200, 2000);
    },
    lazyConnect: true,
    enableOfflineQueue: false,
  });

  client.on("connect", () => {
    console.log("Redis connected");
  });

  client.on("error", (err) => {
    console.error("Redis error:", err.message);
  });

  client.on("close", () => {
    console.warn("Redis connection closed");
  });

  return client;
}

export async function connectRedis() {
  if (redisClient && (redisClient.status === "ready" || redisClient.status === "connecting")) {
    return redisClient;
  }

  try {
    if (redisClient) {
      try {
        redisClient.disconnect();
      } catch {
        // Ignore disconnect errors
      }
    }
    redisClient = createClient();
    await redisClient.connect();
  } catch (error) {
    console.warn("Redis unavailable, proceeding without Redis:", error.message);
    redisClient = null;
  }

  return redisClient;
}

export function getRedisClient() {
  if (redisClient && (redisClient.status === "ready" || redisClient.status === "connecting")) {
    return redisClient;
  }
  return null;
}

export { redisClient };
