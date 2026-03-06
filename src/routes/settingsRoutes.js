const express = require('express');
const { getSettings, updateSetting } = require('../controllers/settingsController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.get('/', protect, getSettings);
router.put('/', protect, authorize('Admin'), updateSetting);

module.exports = router;
