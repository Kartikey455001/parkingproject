const ParkingSlot = require('../models/ParkingSlot');

exports.createSlot = async (req, res) => {
    try {
        const slot = await ParkingSlot.create(req.body);
        res.status(201).json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSlots = async (req, res) => {
    try {
        const slots = await ParkingSlot.find();
        res.status(200).json(slots);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getSlotById = async (req, res) => {
    try {
        const slot = await ParkingSlot.findById(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.status(200).json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSlot = async (req, res) => {
    try {
        const slot = await ParkingSlot.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.status(200).json(slot);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteSlot = async (req, res) => {
    try {
        const slot = await ParkingSlot.findByIdAndDelete(req.params.id);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });
        res.status(200).json({ message: 'Slot deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
