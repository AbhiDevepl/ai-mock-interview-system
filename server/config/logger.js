import AuditLog from "../models/auditLog.model.js";

const AUTH_EVENTS = [
  "LOGIN_SUCCESS",
  "LOGIN_FAILURE",
  "LOGOUT",
  "TOKEN_EXPIRED",
  "TOKEN_INVALID",
  "UNAUTHORIZED_ACCESS",
  "USER_CREATED",
  "USER_UPDATED",
  "SESSION_REFRESH",
];

export function createAuditEntry({ event, userId, email, ip, userAgent, metadata }) {
  if (!AUTH_EVENTS.includes(event)) {
    console.error(`Invalid audit event: ${event}`);
    return;
  }

  const entry = new AuditLog({
    event,
    userId: userId || null,
    email: email || null,
    ip: ip || null,
    userAgent: userAgent || null,
    metadata: metadata || {},
  });

  entry.save().catch((err) => {
    console.error("Audit log write failed:", err.message);
  });
}

export function logAuthEvent(event, req, extra = {}) {
  const ip = req.ip || req.connection?.remoteAddress || null;
  const userAgent = req.get("User-Agent") || null;

  createAuditEntry({
    event,
    ip,
    userAgent,
    ...extra,
  });
}
