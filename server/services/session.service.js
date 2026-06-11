import { v4 as uuidv4 } from "uuid";
import { getUpstashClient } from "./upstash.js";

const SESSION_PREFIX = "auth:session";
const BLACKLIST_PREFIX = "auth:blacklist";
const USER_SESSIONS_PREFIX = "auth:user-sessions";
const LOGIN_ATTEMPTS_PREFIX = "auth:login-attempts";
const SESSION_TTL = 7 * 24 * 60 * 60;

export function generateDeviceId(req) {
  const ua = req.get("User-Agent") || "unknown";
  const ip = req.ip || req.connection?.remoteAddress || "0.0.0.0";
  const hash = uuidv4();
  return hash;
}

export async function createSession(userId, deviceId, { role, ip, device, deviceName, jti, nonce }) {
  const client = getUpstashClient();
  if (!client) return null;

  const sessionKey = `${SESSION_PREFIX}:${userId}:${deviceId}`;

  await client.hset(sessionKey, {
    userId: String(userId),
    role: role || "user",
    jti,
    device: device || "unknown",
    deviceName: deviceName || "",
    ip: ip || "0.0.0.0",
    loginTs: new Date().toISOString(),
    lastActivityTs: new Date().toISOString(),
    nonce: String(nonce || 0),
  });

  await client.expire(sessionKey, SESSION_TTL);

  await client.sadd(`${USER_SESSIONS_PREFIX}:${userId}`, deviceId);

  return sessionKey;
}

export async function getSession(userId, deviceId) {
  const client = getUpstashClient();
  if (!client) return null;

  try {
    const sessionKey = `${SESSION_PREFIX}:${userId}:${deviceId}`;
    const session = await client.hgetall(sessionKey);
    return session;
  } catch (err) {
    console.warn("Session lookup failed:", err.message);
    return null;
  }
}

export async function touchSession(userId, deviceId) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const sessionKey = `${SESSION_PREFIX}:${userId}:${deviceId}`;
    await Promise.all([
      client.hset(sessionKey, { lastActivityTs: new Date().toISOString() }),
      client.expire(sessionKey, SESSION_TTL),
    ]);
  } catch (err) {
    console.warn("Session touch failed:", err.message);
  }
}

export async function deleteSession(userId, deviceId) {
  const client = getUpstashClient();
  if (!client) return;

  const sessionKey = `${SESSION_PREFIX}:${userId}:${deviceId}`;
  await client.del(sessionKey);
  await client.srem(`${USER_SESSIONS_PREFIX}:${userId}`, deviceId);
}

export async function deleteAllUserSessions(userId) {
  const client = getUpstashClient();
  if (!client) return;

  const sessionsKey = `${USER_SESSIONS_PREFIX}:${userId}`;
  const deviceIds = await client.smembers(sessionsKey);

  if (deviceIds && deviceIds.length > 0) {
    const keys = deviceIds.map((did) => `${SESSION_PREFIX}:${userId}:${did}`);
    if (keys.length > 0) {
      await client.del(...keys);
    }
  }

  await client.del(sessionsKey);
}

export async function getUserDeviceIds(userId) {
  const client = getUpstashClient();
  if (!client) return [];

  const sessionsKey = `${USER_SESSIONS_PREFIX}:${userId}`;
  return await client.smembers(sessionsKey) || [];
}

export async function blacklistJti(jti, ttlSeconds) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    if (ttlSeconds > 0) {
      await client.setex(`${BLACKLIST_PREFIX}:${jti}`, ttlSeconds, "1");
    }
  } catch (err) {
    console.warn("Blacklist write failed:", err.message);
  }
}

export async function isJtiBlacklisted(jti) {
  const client = getUpstashClient();
  if (!client) return false;

  try {
    const result = await client.exists(`${BLACKLIST_PREFIX}:${jti}`);
    return result === 1;
  } catch (err) {
    console.warn("Blacklist check failed:", err.message);
    return false;
  }
}

export async function recordLoginAttempt(email) {
  const client = getUpstashClient();
  if (!client) return;

  const key = `${LOGIN_ATTEMPTS_PREFIX}:${email}`;
  const now = Date.now();
  await client.rpush(key, String(now));
  await client.ltrim(key, -20, -1);
  await client.expire(key, 900);
}

export async function getRecentLoginAttempts(email) {
  const client = getUpstashClient();
  if (!client) return [];

  const key = `${LOGIN_ATTEMPTS_PREFIX}:${email}`;
  const attempts = await client.lrange(key, 0, -1);
  return (attempts || []).map(Number).filter(Boolean);
}

export async function isLoginBlocked(email, maxAttempts = 5, windowMs = 900000) {
  const client = getUpstashClient();
  if (!client) return false;

  const key = `${LOGIN_ATTEMPTS_PREFIX}:${email}`;
  const attempts = await client.lrange(key, 0, -1);
  if (!attempts || attempts.length === 0) return false;

  const cutoff = Date.now() - windowMs;
  const recentAttempts = attempts.map(Number).filter((t) => t > cutoff);

  return recentAttempts.length >= maxAttempts;
}
