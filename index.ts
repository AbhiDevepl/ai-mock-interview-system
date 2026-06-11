import { Redis } from "@upstash/redis/cloudflare";
import { Ratelimit } from "@upstash/ratelimit";

export interface Env {
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  ORIGIN_SERVER: string;
  JWT_SECRET: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = {
      "Access-Control-Allow-Origin": env.ORIGIN_SERVER || "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, Cookie",
      "Access-Control-Allow-Credentials": "true",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    const redis = Redis.fromEnv(env);

    const ip = request.headers.get("CF-Connecting-IP") || "unknown";
    const cookieHeader = request.headers.get("Cookie") || "";

    let userId: string | null = null;
    let isAuthenticated = false;

    const isPublicEndpoint = path === "/api/auth/google" || path === "/api/auth/logout";

    if (isPublicEndpoint) {
      const ipRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(20, "15 m"),
        prefix: "authcat:ratelimit:ip",
        ephemeralCache: new Map(),
        timeout: 1000,
      });

      const { success: ipAllowed, pending: ipPending } = await ipRatelimit.limit(ip);
      ctx.waitUntil(ipPending);

      if (!ipAllowed) {
        return new Response(
          JSON.stringify({ message: "Too many requests. Please try again later." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    const token = extractCookie(cookieHeader, "token");
    if (token) {
      try {
        const payload = parseJwt(token);
        if (payload && payload.exp > Math.floor(Date.now() / 1000)) {
          userId = payload.userId;

          const jti = payload.jti;
          const blacklistKey = `auth:blacklist:${jti}`;
          const blacklisted = await redis.exists(blacklistKey);
          if (blacklisted === 0) {
            isAuthenticated = true;
          }
        }
      } catch {
      }
    }

    if (isAuthenticated && userId) {
      const userRatelimit = new Ratelimit({
        redis,
        limiter: Ratelimit.slidingWindow(100, "1 m"),
        prefix: "authcat:ratelimit:user",
        ephemeralCache: new Map(),
        timeout: 1000,
      });

      const { success: userAllowed, pending: userPending } = await userRatelimit.limit(userId);
      ctx.waitUntil(userPending);

      if (!userAllowed) {
        return new Response(
          JSON.stringify({ message: "Too many requests. Please slow down." }),
          { status: 429, headers: { "Content-Type": "application/json", ...corsHeaders } },
        );
      }
    }

    const forwardedHeaders = new Headers(request.headers);
    forwardedHeaders.set("x-auth-user-id", userId || "");
    forwardedHeaders.set("x-auth-authenticated", isAuthenticated ? "true" : "false");

    try {
      const originUrl = new URL(path + url.search, env.ORIGIN_SERVER).toString();
      const originRequest = new Request(originUrl, {
        method: request.method,
        headers: forwardedHeaders,
        body: request.method !== "GET" && request.method !== "HEAD" ? request.body : undefined,
        redirect: request.redirect,
      });
      const originResponse = await fetch(originRequest);
      return withCors(originResponse, corsHeaders);
    } catch (err) {
      return new Response(
        JSON.stringify({ message: "Origin server unavailable" }),
        { status: 502, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }
  },
};

function extractCookie(cookieHeader: string, name: string): string | null {
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? match[1] : null;
}

function withCors(response: Response, corsHeaders: Record<string, string>): Response {
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders)) {
    headers.set(key, value);
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function parseJwt(token: string): { userId: string; jti: string; role: string; exp: number } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return {
      userId: payload.userId,
      jti: payload.jti,
      role: payload.role || "user",
      exp: payload.exp,
    };
  } catch {
    return null;
  }
}
