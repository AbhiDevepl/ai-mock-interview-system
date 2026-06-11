export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.userId) {
      return res.status(401).json({ message: "Authentication required." });
    }

    if (!req.userRole) {
      return res.status(403).json({ message: "Access denied." });
    }

    if (!roles.includes(req.userRole)) {
      return res.status(403).json({ message: "Insufficient permissions." });
    }

    next();
  };
}

export function requireAdmin(req, res, next) {
  return requireRole("admin", "superadmin")(req, res, next);
}

export function requireSuperAdmin(req, res, next) {
  return requireRole("superadmin")(req, res, next);
}
