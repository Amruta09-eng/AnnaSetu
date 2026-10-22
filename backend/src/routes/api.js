// RESTful API Router for AnnaSetu

const express = require('express');
const router = express.Router();

const { authenticateToken, requireRoles } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const donationCtrl = require('../controllers/donationController');
const requestCtrl = require('../controllers/requestController');
const matchingCtrl = require('../controllers/matchingController');
const userCtrl = require('../controllers/userController');
const notificationCtrl = require('../controllers/notificationController');
const reportCtrl = require('../controllers/reportController');

// --- Health Check ---
router.get('/health', (req, res) => {
  return res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'AnnaSetu REST API'
  });
});

// --- Public Authentication Routes ---
router.post('/register', authCtrl.register);
router.post('/login', authCtrl.login);

// --- Protected Authentication & Profile Routes ---
router.post('/logout', authenticateToken, authCtrl.logout);
router.get('/me', authenticateToken, authCtrl.getMe);
router.get('/profile', authenticateToken, authCtrl.getProfile);
router.post('/profile', authenticateToken, authCtrl.updateProfile);

// --- Donation Routes ---
router.get('/donations', authenticateToken, donationCtrl.listDonations);
router.post('/donations', authenticateToken, requireRoles('donor'), donationCtrl.createDonation);
router.post('/donations/edit', authenticateToken, requireRoles('donor'), donationCtrl.editDonation);
router.post('/donations/action', authenticateToken, requireRoles('donor', 'ngo', 'volunteer', 'admin'), donationCtrl.handleLifecycleAction);
router.get('/history', authenticateToken, requireRoles('donor', 'ngo', 'admin'), donationCtrl.getDonationHistory);

// --- Emergency & Resource Request Routes ---
router.get('/requests', authenticateToken, requireRoles('beneficiary', 'ngo', 'admin', 'donor'), requestCtrl.listRequests);
router.post('/requests', authenticateToken, requireRoles('beneficiary', 'ngo'), requestCtrl.createRequest);
router.post('/requests/status', authenticateToken, requireRoles('ngo', 'admin'), requestCtrl.updateRequestStatus);

// --- Smart Resource Matching ---
router.get('/matches', authenticateToken, requireRoles('ngo', 'admin'), matchingCtrl.getSmartMatches);

// --- Volunteer & User Administration ---
router.get('/volunteers', authenticateToken, requireRoles('ngo', 'admin'), userCtrl.listVolunteers);
router.get('/users', authenticateToken, requireRoles('admin'), userCtrl.listUsers);
router.post('/users/verify', authenticateToken, requireRoles('admin'), userCtrl.verifyUser);

// --- In-App Notifications ---
router.get('/notifications', authenticateToken, notificationCtrl.listNotifications);
router.post('/notifications/read', authenticateToken, notificationCtrl.markNotificationsRead);

// --- Platform Analytics & Reports ---
router.get('/reports', authenticateToken, requireRoles('admin'), reportCtrl.getReports);

module.exports = router;
