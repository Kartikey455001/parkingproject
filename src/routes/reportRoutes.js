const express = require('express');
const { createReport, getReports, updateReportStatus } = require('../controllers/reportController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.post('/', protect, createReport);
router.get('/', protect, authorize('Admin', 'ParkingStaff'), getReports);
router.put('/:id/status', protect, authorize('Admin', 'ParkingStaff'), updateReportStatus);

module.exports = router;
