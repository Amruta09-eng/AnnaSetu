// Platform Metrics & Audit Reports Controller

const { db } = require('../config/db');

/**
 * Get comprehensive analytics and platform metrics
 * GET /api/reports (role: admin)
 */
async function getReports(req, res) {
  try {
    const getCount = async (sql) => {
      const row = await db.prepare(sql).get();
      return Number(row ? row.c : 0);
    };

    const [
      donations_created,
      donations_delivered,
      active_requests,
      completed_tasks,
      quantity_delivered_units,
      users,
      verified_volunteers,
      verified_ngos,
      total_requests
    ] = await Promise.all([
      getCount('SELECT COUNT(*) AS c FROM donations'),
      getCount("SELECT COUNT(*) AS c FROM donations WHERE status = 'Delivered'"),
      getCount("SELECT COUNT(*) AS c FROM requests WHERE status != 'Fulfilled'"),
      getCount("SELECT COUNT(*) AS c FROM tasks WHERE status = 'Delivered'"),
      getCount("SELECT COALESCE(SUM(quantity), 0) AS c FROM donations WHERE status = 'Delivered'"),
      getCount('SELECT COUNT(*) AS c FROM users'),
      getCount("SELECT COUNT(*) AS c FROM users WHERE role = 'volunteer' AND verified = 1"),
      getCount("SELECT COUNT(*) AS c FROM users WHERE role = 'ngo' AND verified = 1"),
      getCount('SELECT COUNT(*) AS c FROM requests')
    ]);

    const reports = {
      donations_created,
      donations_delivered,
      active_requests,
      completed_tasks,
      quantity_delivered_units,
      users,
      verified_volunteers,
      verified_ngos,
      total_requests
    };

    return res.status(200).json(reports);
  } catch (err) {
    console.error('Reports error:', err);
    return res.status(500).json({ errors: ['Failed to generate reports'] });
  }
}

module.exports = {
  getReports
};

