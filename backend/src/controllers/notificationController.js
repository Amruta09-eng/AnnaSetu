// In-App Notification Center Controller

const { db } = require('../config/db');

/**
 * List recent notifications for the logged-in user
 * GET /api/notifications
 */
async function listNotifications(req, res) {
  try {
    const notifications = await db.prepare(`
      SELECT id, user_id, message, is_read, created
      FROM notifications
      WHERE user_id = ?
      ORDER BY id DESC
      LIMIT 30
    `).all(req.user.id);

    return res.status(200).json(notifications);
  } catch (err) {
    console.error('List notifications error:', err);
    return res.status(500).json({ errors: ['Failed to list notifications'] });
  }
}

/**
 * Mark all notifications as read for current user
 * POST /api/notifications/read
 */
async function markNotificationsRead(req, res) {
  try {
    await db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Mark read error:', err);
    return res.status(500).json({ errors: ['Failed to update notifications'] });
  }
}

module.exports = {
  listNotifications,
  markNotificationsRead
};

