// Smart Resource Matching Controller

const { db } = require('../config/db');

/**
 * Suggest optimal pairings between available donations and active emergency requests
 * GET /api/matches (roles: ngo, admin)
 */
async function getSmartMatches(req, res) {
  try {
    const query = `
      SELECT
        d.id AS donation_id,
        d.title,
        d.category,
        d.quantity AS donation_qty,
        d.pickup AS donation_pickup,
        r.id AS request_id,
        r.location,
        r.urgency,
        r.quantity AS request_qty
      FROM donations d
      JOIN requests r ON r.category = d.category
      WHERE d.status IN ('Submitted', 'Available')
        AND r.status != 'Fulfilled'
      ORDER BY
        CASE r.urgency
          WHEN 'Critical' THEN 0
          WHEN 'High' THEN 1
          WHEN 'Medium' THEN 2
          ELSE 3
        END,
        ABS(d.quantity - r.quantity) ASC
      LIMIT 20
    `;

    const matches = await db.prepare(query).all();
    return res.status(200).json(matches);
  } catch (err) {
    console.error('Smart match error:', err);
    return res.status(500).json({ errors: ['Failed to compute smart matches'] });
  }
}

module.exports = {
  getSmartMatches
};
