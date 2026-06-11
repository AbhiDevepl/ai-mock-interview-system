import mongoose from "mongoose";

const auditLogSchema = new mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
      enum: [
        "LOGIN_SUCCESS",
        "LOGIN_FAILURE",
        "LOGOUT",
        "TOKEN_EXPIRED",
        "TOKEN_INVALID",
        "UNAUTHORIZED_ACCESS",
        "USER_CREATED",
        "USER_UPDATED",
        "SESSION_REFRESH",
      ],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    email: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

auditLogSchema.index({ event: 1, createdAt: -1 });
auditLogSchema.index({ userId: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

const AuditLog = mongoose.model("AuditLog", auditLogSchema);

export default AuditLog;
