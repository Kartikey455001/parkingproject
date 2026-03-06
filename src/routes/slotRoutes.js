const express = require('express');
const { createSlot, getSlots, getSlotById, updateSlot, deleteSlot } = require('../controllers/slotController');
const { protect, authorize } = require('../middlewares/auth');

const router = express.Router();

router.route('/')
    .get(getSlots)
    .post(protect, authorize('Admin'), createSlot);

router.route('/:id')
    .get(getSlotById)
    .put(protect, authorize('Admin'), updateSlot)
    .delete(protect, authorize('Admin'), deleteSlot);

module.exports = router;
