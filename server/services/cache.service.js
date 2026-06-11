import { getUpstashClient, withRedisFallback } from "./upstash.js";

const USER_CACHE_PREFIX = "cache:user";
const PERMISSIONS_CACHE_PREFIX = "cache:permissions";
const ROLES_CACHE_PREFIX = "cache:roles";

const DEFAULT_USER_TTL = 900;
const DEFAULT_PERMISSIONS_TTL = 3600;
const DEFAULT_ROLES_TTL = 3600;

export async function getCachedUser(userId) {
  const client = getUpstashClient();
  if (!client) return null;

  try {
    const key = `${USER_CACHE_PREFIX}:${userId}`;
    const data = await client.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

export async function setCachedUser(userId, userData, ttl = DEFAULT_USER_TTL) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${USER_CACHE_PREFIX}:${userId}`;
    const payload = JSON.stringify(userData);
    await client.setex(key, ttl, payload);
  } catch (err) {
    console.warn("Failed to cache user:", err.message);
  }
}

export async function invalidateUserCache(userId) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${USER_CACHE_PREFIX}:${userId}`;
    await client.del(key);
  } catch {
  }
}

export async function getCachedPermissions(userId) {
  const client = getUpstashClient();
  if (!client) return null;

  try {
    const key = `${PERMISSIONS_CACHE_PREFIX}:${userId}`;
    const data = await client.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

export async function setCachedPermissions(userId, permissions, ttl = DEFAULT_PERMISSIONS_TTL) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${PERMISSIONS_CACHE_PREFIX}:${userId}`;
    await client.setex(key, ttl, JSON.stringify(permissions));
  } catch {
  }
}

export async function invalidatePermissionsCache(userId) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${PERMISSIONS_CACHE_PREFIX}:${userId}`;
    await client.del(key);
  } catch {
  }
}

export async function getCachedRoles(userId) {
  const client = getUpstashClient();
  if (!client) return null;

  try {
    const key = `${ROLES_CACHE_PREFIX}:${userId}`;
    const data = await client.get(key);
    if (!data) return null;
    return typeof data === "string" ? JSON.parse(data) : data;
  } catch {
    return null;
  }
}

export async function setCachedRoles(userId, roles, ttl = DEFAULT_ROLES_TTL) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${ROLES_CACHE_PREFIX}:${userId}`;
    await client.setex(key, ttl, JSON.stringify(roles));
  } catch {
  }
}

export async function invalidateRolesCache(userId) {
  const client = getUpstashClient();
  if (!client) return;

  try {
    const key = `${ROLES_CACHE_PREFIX}:${userId}`;
    await client.del(key);
  } catch {
  }
}

export async function invalidateAllUserCaches(userId) {
  await Promise.all([
    invalidateUserCache(userId),
    invalidatePermissionsCache(userId),
    invalidateRolesCache(userId),
  ]);
}
