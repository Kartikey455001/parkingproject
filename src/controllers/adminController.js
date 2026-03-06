const ParkingSlot = require('../models/ParkingSlot');
const ParkingSession = require('../models/ParkingSession');
const Payment = require('../models/Payment');
const User = require('../models/User');

exports.getDashboardStats = async (req, res) => {
    try {
        const slots = await ParkingSlot.find();
        const totalSlots = slots.length;
        const occupiedSlots = slots.filter(s => s.status === 'Occupied').length;
        const availableSlots = slots.filter(s => s.status === 'Available').length;
        const reservedSlots = slots.filter(s => s.status === 'Booked').length;
        const staffSlots = slots.filter(s => s.slotType === 'Staff').length;

        // Daily revenue (today)
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

        const dailyPayments = await Payment.find({
            status: 'Completed',
            createdAt: { $gte: startOfDay, $lte: endOfDay }
        });

        const dailyRevenue = dailyPayments.reduce((acc, curr) => acc + curr.amount, 0);

        res.status(200).json({
            stats: {
                totalSlots,
                occupiedSlots,
                availableSlots,
                reservedSlots,
                staffSlots,
                dailyRevenue
            }
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json(users);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.params.id, { role: req.body.role }, { new: true });
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
