// Donation Lifecycle Controller & Finite-State Engine

const { db, notify, logHistory } = require('../config/db');
const { LIFECYCLE_TRANSITIONS } = require('../config/constants');
const { validateDonationInput } = require('../middleware/validation');

const DONATION_BASE_QUERY = `
  SELECT
    d.*,
    u.name AS donor_name,
    x.ngo_id,
    x.delivery_location,
    k.volunteer_id,
    k.status AS task_status,
    v.name AS volunteer_name
  FROM donations d
  JOIN users u ON u.id = d.donor_id
  LEFT JOIN distributions x ON x.donation_id = d.id
  LEFT JOIN tasks k ON k.distribution_id = x.id
  LEFT JOIN users v ON v.id = k.volunteer_id
`;

/**
 * Create a new donation
 * POST /api/donations (role: donor)
 */
async function createDonation(req, res) {
  const errors = validateDonationInput(req.body);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  const { title, category, quantity, servings, prepared_at, deadline, description, pickup, request_id } = req.body;

  let requestId = null;
  if (request_id) {
    const parsedId = Number(request_id);
    const existingReq = await db.prepare('SELECT id FROM requests WHERE id = ?').get(parsedId);
    if (!existingReq) {
      return res.status(400).json({ errors: ['Unknown request'] });
    }
    requestId = parsedId;
  }

  try {
    const result = await db.prepare(`
      INSERT INTO donations (
        donor_id, request_id, title, category, quantity,
        servings, prepared_at, deadline, description, pickup
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.user.id,
      requestId,
      title.trim(),
      category,
      Number(quantity),
      servings ? Number(servings) : null,
      prepared_at || null,
      deadline || null,
      description ? description.trim() : '',
      pickup.trim()
    );

    const donationId = Number(result.lastInsertRowid);
    await logHistory(donationId, 'Created');
    await notify(req.user.id, `Donation "${title.trim()}" created; submit it for NGO review`);

    return res.status(201).json({ id: donationId, status: 'Created' });
  } catch (err) {
    console.error('Create donation error:', err);
    return res.status(500).json({ errors: ['Failed to create donation'] });
  }
}

/**
 * Edit an existing donation (only when in Created status)
 * POST /api/donations/edit (role: donor)
 */
async function editDonation(req, res) {
  const donationId = Number(req.body.id);
  const donation = await db.prepare('SELECT * FROM donations WHERE id = ?').get(donationId);

  if (!donation || donation.donor_id !== req.user.id) {
    return res.status(404).json({ errors: ['Not found'] });
  }

  if (donation.status !== 'Created') {
    return res.status(409).json({ errors: ['Only donations not yet accepted can be edited'] });
  }

  const merged = { ...donation, ...req.body };
  const errors = validateDonationInput(merged);
  if (errors.length > 0) {
    return res.status(400).json({ errors });
  }

  try {
    await db.prepare(`
      UPDATE donations
      SET title = ?, category = ?, quantity = ?, servings = ?, deadline = ?, description = ?, pickup = ?
      WHERE id = ?
    `).run(
      merged.title.trim(),
      merged.category,
      Number(merged.quantity),
      merged.servings ? Number(merged.servings) : null,
      merged.deadline || null,
      merged.description || '',
      merged.pickup.trim(),
      donation.id
    );

    return res.status(200).json({ ok: true, message: 'Donation updated successfully' });
  } catch (err) {
    console.error('Edit donation error:', err);
    return res.status(500).json({ errors: ['Failed to update donation'] });
  }
}

/**
 * List donations filtered by role and search/category/status query params
 * GET /api/donations
 */
async function listDonations(req, res) {
  const role = req.user.role;
  let whereClause = '';
  let params = [];

  switch (role) {
    case 'donor':
      whereClause = 'WHERE d.donor_id = ?';
      params = [req.user.id];
      break;
    case 'ngo':
      whereClause = 'WHERE (d.status = ? OR x.ngo_id = ?)';
      params = ['Submitted', req.user.id];
      break;
    case 'volunteer':
      whereClause = 'WHERE k.volunteer_id = ?';
      params = [req.user.id];
      break;
    case 'admin':
      whereClause = 'WHERE 1 = 1';
      params = [];
      break;
    case 'beneficiary':
      whereClause = 'WHERE 0 = 1';
      params = [];
      break;
    default:
      whereClause = 'WHERE 0 = 1';
      params = [];
  }

  try {
    let rows = await db.prepare(`${DONATION_BASE_QUERY} ${whereClause} ORDER BY d.id DESC`).all(...params);

    const search = req.query.search ? String(req.query.search).toLowerCase() : null;
    const category = req.query.category ? String(req.query.category) : null;
    const status = req.query.status ? String(req.query.status) : null;

    if (search) {
      rows = rows.filter(r => r.title.toLowerCase().includes(search));
    }
    if (category) {
      rows = rows.filter(r => r.category === category);
    }
    if (status) {
      rows = rows.filter(r => r.status === status);
    }

    return res.status(200).json(rows);
  } catch (err) {
    console.error('List donations error:', err);
    return res.status(500).json({ errors: ['Failed to list donations'] });
  }
}

/**
 * Get donation audit trail history
 * GET /api/history (roles: admin, donor, ngo)
 */
async function getDonationHistory(req, res) {
  const donationId = Number(req.query.donation_id);
  if (!donationId) {
    return res.status(400).json({ errors: ['donation_id is required'] });
  }

  try {
    const donation = await db.prepare(`${DONATION_BASE_QUERY} WHERE d.id = ?`).get(donationId);

    if (!donation) {
      return res.status(404).json({ errors: ['Not found'] });
    }

    if (req.user.role === 'donor' && donation.donor_id !== req.user.id) {
      return res.status(404).json({ errors: ['Not found'] });
    }

    if (req.user.role === 'ngo' && donation.ngo_id !== req.user.id && donation.status !== 'Submitted') {
      return res.status(404).json({ errors: ['Not found'] });
    }

    const history = await db.prepare(`
      SELECT status, at FROM history WHERE donation_id = ? ORDER BY id ASC
    `).all(donationId);

    return res.status(200).json(history);
  } catch (err) {
    console.error('History fetch error:', err);
    return res.status(500).json({ errors: ['Failed to fetch history'] });
  }
}

/**
 * Perform a lifecycle transition action
 * POST /api/donations/action (roles: donor, ngo, volunteer, admin)
 */
async function handleLifecycleAction(req, res) {
  const { id, action, volunteer_id, delivery_location } = req.body || {};
  const donationId = Number(id);

  const transition = LIFECYCLE_TRANSITIONS[action];
  const donation = await db.prepare(`${DONATION_BASE_QUERY} WHERE d.id = ?`).get(donationId);

  if (!transition || !donation) {
    return res.status(404).json({ errors: ['Unknown donation or action'] });
  }

  // Check RBAC permission for this action
  if (!transition.role.includes(req.user.role)) {
    return res.status(403).json({ errors: ['Your role cannot perform this action'] });
  }

  // Check if current state allows this transition
  if (!transition.from.includes(donation.status)) {
    return res.status(409).json({ errors: [`Cannot ${action} a donation that is ${donation.status}`] });
  }

  // Enforce record ownership / assignment
  if (req.user.role === 'donor' && donation.donor_id !== req.user.id) {
    return res.status(403).json({ errors: ['Not your record'] });
  }
  if (req.user.role === 'volunteer' && donation.volunteer_id !== req.user.id) {
    return res.status(403).json({ errors: ['Not your record'] });
  }
  if (req.user.role === 'ngo' && action !== 'review' && donation.ngo_id !== req.user.id) {
    return res.status(403).json({ errors: ['Not your record'] });
  }

  try {
    // Action: submit -> Notify verified NGOs
    if (action === 'submit') {
      const verifiedNgos = await db.prepare("SELECT id FROM users WHERE role = 'ngo' AND verified = 1").all();
      for (const ngo of verifiedNgos) {
        await notify(ngo.id, `New donation to review: ${donation.title}`);
      }
    }

    // Action: review -> NGO claims the donation into distributions table
    if (action === 'review') {
      const ngoUser = await db.prepare('SELECT verified FROM users WHERE id = ?').get(req.user.id);
      if (!ngoUser || !ngoUser.verified) {
        return res.status(403).json({ errors: ['NGO not yet verified by administrator'] });
      }
      await db.prepare('INSERT INTO distributions (donation_id, ngo_id) VALUES (?, ?)').run(donation.id, req.user.id);
    }

    // Action: assign -> NGO assigns verified & available volunteer
    if (action === 'assign') {
      if (!delivery_location || !delivery_location.trim()) {
        return res.status(400).json({ errors: ['Delivery location is required'] });
      }

      const volunteer = await db.prepare(`
        SELECT id FROM users WHERE id = ? AND role = 'volunteer' AND verified = 1 AND available = 1
      `).get(Number(volunteer_id));

      if (!volunteer) {
        return res.status(400).json({ errors: ['Select a verified, available volunteer'] });
      }

      await db.prepare('UPDATE distributions SET delivery_location = ? WHERE donation_id = ?').run(
        delivery_location.trim(),
        donation.id
      );

      const dist = await db.prepare('SELECT id FROM distributions WHERE donation_id = ?').get(donation.id);
      if (dist) {
        await db.prepare('INSERT INTO tasks (distribution_id, volunteer_id) VALUES (?, ?)').run(dist.id, volunteer.id);
      }

      await notify(volunteer.id, `New task: pick up "${donation.title}" from ${donation.pickup}`);
    }

    // Action: start -> Volunteer begins transit
    if (action === 'start') {
      const dist = await db.prepare('SELECT id FROM distributions WHERE donation_id = ?').get(donation.id);
      if (dist) {
        await db.prepare("UPDATE tasks SET status = 'InTransit', started = CURRENT_TIMESTAMP WHERE distribution_id = ?").run(dist.id);
      }
    }

    // Action: deliver -> Volunteer marks delivered; auto-fulfill linked emergency request if any
    if (action === 'deliver') {
      const dist = await db.prepare('SELECT id FROM distributions WHERE donation_id = ?').get(donation.id);
      if (dist) {
        await db.prepare("UPDATE tasks SET status = 'Delivered', delivered = CURRENT_TIMESTAMP WHERE distribution_id = ?").run(dist.id);
      }

      await db.prepare("UPDATE distributions SET status = 'Completed' WHERE donation_id = ?").run(donation.id);

      if (donation.request_id) {
        await db.prepare("UPDATE requests SET status = 'Fulfilled' WHERE id = ?").run(donation.request_id);
      }
    }

    // Update donation status and log to history
    await db.prepare('UPDATE donations SET status = ? WHERE id = ?').run(transition.to, donation.id);
    await logHistory(donation.id, transition.to);

    // Notify donor and handling NGO of the progress
    const handlingNgoId = donation.ngo_id || (action === 'review' ? req.user.id : null);
    const partiesToNotify = new Set([donation.donor_id, handlingNgoId].filter(Boolean));
    for (const uid of partiesToNotify) {
      if (uid !== req.user.id) {
        await notify(uid, `Donation "${donation.title}" is now: ${transition.to}`);
      }
    }

    return res.status(200).json({ status: transition.to });
  } catch (err) {
    console.error('Lifecycle action error:', err);
    return res.status(500).json({ errors: ['Failed to execute lifecycle action'] });
  }
}

module.exports = {
  createDonation,
  editDonation,
  listDonations,
  getDonationHistory,
  handleLifecycleAction
};
