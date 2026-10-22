// User Administration & Volunteer Management Controller

const { db, notify } = require('../config/db');

/**
 * List all registered users
 * GET /api/users (role: admin)
 */
async function listUsers(req, res) {
  try {
    const users = await db.prepare(`
      SELECT id, name, email, role, phone, address, org_name, verified, available, created_at
      FROM users
      ORDER BY id ASC
    `).all();

    return res.status(200).json(users);
  } catch (err) {
    console.error('List users error:', err);
    return res.status(500).json({ errors: ['Failed to list users'] });
  }
}

/**
 * Admin verification for NGOs and Volunteers
 * POST /api/users/verify (role: admin)
 */
async function verifyUser(req, res) {
  const userId = Number(req.body.id);

  try {
    const result = await db.prepare(`
      UPDATE users
      SET verified = 1
      WHERE id = ? AND role IN ('ngo', 'volunteer')
    `).run(userId);

    if (!result.changes) {
      return res.status(404).json({ errors: ['NGO/volunteer not found'] });
    }

    await notify(userId, 'Your account was verified by the administrator');
    return res.status(200).json({ ok: true, message: 'User verified successfully' });
  } catch (err) {
    console.error('Verify user error:', err);
    return res.status(500).json({ errors: ['Failed to verify user'] });
  }
}

/**
 * List active, verified, available volunteers for dispatching
 * GET /api/volunteers (roles: admin, ngo)
 */
async function listVolunteers(req, res) {
  try {
    const volunteers = await db.prepare(`
      SELECT id, name, phone, address
      FROM users
      WHERE role = 'volunteer' AND verified = 1 AND available = 1
      ORDER BY name ASC
    `).all();

    return res.status(200).json(volunteers);
  } catch (err) {
    console.error('List volunteers error:', err);
    return res.status(500).json({ errors: ['Failed to list volunteers'] });
  }
}

module.exports = {
  listUsers,
  verifyUser,
  listVolunteers
};

