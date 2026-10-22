// Emergency Relief & Resource Request Controller

const { db, notify } = require('../config/db');
const { validateRequestInput } = require('../middleware/validation');

/**
 * Create a new emergency / resource request
 * POST /api/requests (roles: beneficiary, ngo)
 */
async function createRequest(req, res) {
  const errors = validateRequestInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const { category, quantity, location, description, urgency } = req.body;

  try {
    const result = await db.prepare(`
      INSERT INTO requests (user_id, category, quantity, location, description, urgency)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      category,
      Number(quantity),
      location.trim(),
      description ? description.trim() : '',
      urgency
    );

    // Notify all active NGOs and Admins of the new emergency request
    const responders = await db.prepare("SELECT id FROM users WHERE role IN ('ngo', 'admin')").all();
    for (const responder of responders) {
      await notify(responder.id, `New ${urgency} emergency request: ${category} ×${quantity} at ${location.trim()}`);
    }

    return res.status(201).json({ ok: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    console.error('Create request error:', err);
    return res.status(500).json({ errors: ['Failed to create request'] });
  }
}

/**
 * List requests filtered by caller role
 * GET /api/requests (roles: beneficiary, ngo, admin, donor)
 */
async function listRequests(req, res) {
  const role = req.user.role;
  let whereClause = '';
  let params = [];

  if (role === 'beneficiary') {
    whereClause = 'WHERE r.user_id = ?';
    params = [req.user.id];
  } else if (role === 'donor') {
    whereClause = "WHERE r.status != 'Fulfilled'";
    params = [];
  } else {
    // ngo, admin
    whereClause = 'WHERE 1 = 1';
    params = [];
  }

  try {
    const query = `
      SELECT r.*, u.name AS requester, u.phone AS requester_phone, u.org_name AS requester_org
      FROM requests r
      JOIN users u ON u.id = r.user_id
      ${whereClause}
      ORDER BY
        CASE r.urgency
          WHEN 'Critical' THEN 0
          WHEN 'High' THEN 1
          WHEN 'Medium' THEN 2
          ELSE 3
        END,
        r.id DESC
    `;

    const rows = await db.prepare(query).all(...params);
    return res.status(200).json(rows);
  } catch (err) {
    console.error('List requests error:', err);
    return res.status(500).json({ errors: ['Failed to list requests'] });
  }
}

/**
 * Update request status (Open -> In Progress -> Fulfilled)
 * POST /api/requests/status (roles: ngo, admin)
 */
async function updateRequestStatus(req, res) {
  const { id, status } = req.body || {};
  const requestId = Number(id);

  const allowedMoves = {
    Open: ['In Progress'],
    'In Progress': ['Fulfilled']
  };

  try {
    const request = await db.prepare('SELECT * FROM requests WHERE id = ?').get(requestId);
    if (!request) {
      return res.status(404).json({ errors: ['Not found'] });
    }

    const permittedTargets = allowedMoves[request.status] || [];
    if (!permittedTargets.includes(status)) {
      return res.status(409).json({ errors: [`Cannot move ${request.status} to ${status}`] });
    }

    await db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, requestId);
    await notify(request.user_id, `Your ${request.category} request status is now: ${status}`);

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Update request status error:', err);
    return res.status(500).json({ errors: ['Failed to update request status'] });
  }
}

module.exports = {
  createRequest,
  listRequests,
  updateRequestStatus
};
