const express = require('express');
const { register, login, getMe, markAlertsRead } = require('../controllers/authController');
const { protect } = require('../middlewares/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/me/alerts/read', protect, markAlertsRead);

module.exports = router;
