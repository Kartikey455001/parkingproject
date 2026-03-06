const Booking = require('../models/Booking');
const ParkingSlot = require('../models/ParkingSlot');
const User = require('../models/User');
const Settings = require('../models/Settings');

exports.createBooking = async (req, res) => {
    try {
        const { slotId, hoursToBook, requestCarWash = false } = req.body;
        const userId = req.user.id;

        // Verify hours
        const duration = parseInt(hoursToBook);
        if (!duration || duration < 1 || duration > 48) {
            return res.status(400).json({ message: 'Please provide a valid booking duration (1-48 hours)' });
        }

        // Check if user already has an active booking
        const existingBooking = await Booking.findOne({ user: userId, status: 'Active' });
        if (existingBooking) {
            return res.status(400).json({ message: 'You already have an active booking' });
        }

        // Check if slot exists and is available
        const slot = await ParkingSlot.findById(slotId);
        if (!slot) return res.status(404).json({ message: 'Slot not found' });

        if (slot.status !== 'Available') {
            return res.status(400).json({ message: 'Slot is not available' });
        }

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (slot.slotType === 'Staff' && user.userType !== 'Staff') {
            return res.status(403).json({ message: 'Only Staff members can book Staff slots' });
        }

        if (slot.hasEVCharger && user.userType !== 'Staff') {
            return res.status(403).json({ message: 'EV Charging slots are reserved for Staff members only' });
        }

        // Prevent double booking using atomic update
        const updatedSlot = await ParkingSlot.findOneAndUpdate(
            { _id: slotId, status: 'Available' },
            { status: 'Booked', currentVehicleNumber: user.vehicleNumber },
            { new: true }
        );

        if (!updatedSlot) {
            return res.status(400).json({ message: 'Failed to book. Slot just got taken.' });
        }

        // Extract booking start time if provided (else use now)
        const startTime = req.body.bookingTime ? new Date(req.body.bookingTime) : new Date();

        // Ensure start time is not in the past
        if (startTime < new Date(Date.now() - 5 * 60000)) { // 5 min buffer
            return res.status(400).json({ message: 'Booking time cannot be in the past' });
        }

        const reservationExpiry = new Date(startTime.getTime() + duration * 60 * 60 * 1000);

        // Dynamic Pricing Engine
        const settings = await Settings.find();
        const getSetting = (key) => settings.find(s => s.key === key)?.value;

        const baseRate = getSetting('base_rate') || 5;
        const staffDiscount = getSetting('staff_discount') || 0.8;
        const evPremium = getSetting('ev_premium') || 0.4;
        const carWashFee = getSetting('car_wash_fee') || 15;

        let multiplier = 1;
        let flatFee = 0;

        // Staff discount
        if (user.userType === 'Staff') multiplier = staffDiscount;
        // EV Premium
        if (slot.hasEVCharger) multiplier += evPremium;
        // Car Wash Addition
        if (requestCarWash) flatFee += carWashFee;

        const totalCost = (baseRate * duration * multiplier) + flatFee;

        const booking = await Booking.create({
            user: userId,
            slot: slotId,
            bookingTime: startTime,
            reservationExpiry,
            totalCost,
            requestCarWash,
            paymentStatus: req.body.paymentStatus || 'Paid' // For demo, assume client pre-authorizes or pays
        });

        res.status(201).json(booking);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getMyBookings = async (req, res) => {
    try {
        const bookings = await Booking.find({ user: req.user.id }).populate('slot');
        // Handle auto-cancellation if expired and still active
        const now = new Date();
        const updatedBookings = await Promise.all(bookings.map(async (booking) => {
            if (booking.status === 'Active' && booking.reservationExpiry < now) {
                booking.status = 'Expired';
                await booking.save();

                // Free the slot
                await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'Available', currentVehicleNumber: null });
            }
            return booking;
        }));

        res.status(200).json(updatedBookings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.cancelBooking = async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });
        if (booking.status !== 'Active') return res.status(400).json({ message: `Cannot cancel a ${booking.status.toLowerCase()} booking` });

        booking.status = 'Cancelled';
        await booking.save();

        // Release slot
        await ParkingSlot.findByIdAndUpdate(booking.slot, { status: 'Available', currentVehicleNumber: null });

        res.status(200).json({ message: 'Booking cancelled successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getAllBookings = async (req, res) => {
    try {
        const bookings = await Booking.find().populate('slot').populate('user', 'name email vehicleNumber');

        // Handle auto-cancellation if expired and still active
        const now = new Date();
        const updatedBookings = await Promise.all(bookings.map(async (booking) => {
            if (booking.status === 'Active' && booking.reservationExpiry < now) {
                booking.status = 'Expired';
                await booking.save();
                if (booking.slot) {
                    await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'Available', currentVehicleNumber: null });
                }
            }
            return booking;
        }));

        res.status(200).json(updatedBookings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
