// Authentication & Role-Based Access Control (RBAC) Middleware

const { db } = require('../config/db');

/**
 * Middleware to authenticate requests using Bearer session token
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return res.status(401).json({ errors: ['Please log in'] });
  }

  try {
    const user = await db.prepare(`
      SELECT u.id, u.name, u.email, u.role, u.verified, u.available, u.org_name, u.phone, u.address
      FROM sessions s
      JOIN users u ON u.id = s.user_id
      WHERE s.token = ?
    `).get(token);

    if (!user) {
      return res.status(401).json({ errors: ['Please log in'] });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(500).json({ errors: ['Authentication error'] });
  }
}

/**
 * Middleware factory to enforce specific allowed roles
 * @param {string[]} roles
 */
function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ errors: ['Please log in'] });
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({ errors: ['Forbidden for your role'] });
    }

    next();
  };
}

module.exports = {
  authenticateToken,
  requireRoles
};
