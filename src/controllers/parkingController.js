const ParkingSession = require('../models/ParkingSession');
const ParkingSlot = require('../models/ParkingSlot');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.checkIn = async (req, res) => {
    try {
        const { bookingId } = req.body;

        const booking = await Booking.findById(bookingId).populate('slot');
        if (!booking) return res.status(404).json({ message: 'Booking not found' });
        if (booking.status !== 'Active') return res.status(400).json({ message: 'Booking is not active' });

        // Check expiry
        if (new Date() > booking.reservationExpiry) {
            booking.status = 'Expired';
            await booking.save();
            await ParkingSlot.findByIdAndUpdate(booking.slot._id, { status: 'Available', currentVehicleNumber: null });
            return res.status(400).json({ message: 'Booking has expired' });
        }

        const slot = await ParkingSlot.findById(booking.slot._id);
        slot.status = 'Occupied';
        await slot.save();

        booking.status = 'Completed';
        await booking.save();

        const session = await ParkingSession.create({
            user: booking.user,
            slot: slot._id,
            booking: booking._id,
            checkInTime: new Date()
        });

        res.status(200).json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.checkOut = async (req, res) => {
    try {
        const { sessionId } = req.body;

        const session = await ParkingSession.findById(sessionId).populate('slot');
        if (!session) return res.status(404).json({ message: 'Session not found' });
        if (session.status === 'Completed') return res.status(400).json({ message: 'Already checked out' });

        session.checkOutTime = new Date();

        // Calculate fee: min 1 hr
        const diffInMs = session.checkOutTime - session.checkInTime;
        const diffInHours = Math.ceil(diffInMs / (1000 * 60 * 60));
        const billableHours = Math.max(1, diffInHours); // Minimum 1 hour charge

        const hourlyRate = session.slot.slotType === 'Staff' ? 100 : 50;
        session.fee = billableHours * hourlyRate;
        session.status = 'Completed';

        await session.save();

        // Release slot
        await ParkingSlot.findByIdAndUpdate(session.slot._id, { status: 'Available', currentVehicleNumber: null });

        res.status(200).json(session);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.simulatePayment = async (req, res) => {
    try {
        const { sessionId, method } = req.body;

        const session = await ParkingSession.findById(sessionId);
        if (!session || session.status !== 'Completed') {
            return res.status(400).json({ message: 'Invalid session for payment' });
        }

        const payment = await Payment.create({
            session: sessionId,
            amount: session.fee,
            method: method || 'Card',
            status: 'Completed'
        });

        res.status(200).json({ message: 'Payment Successful (Demo)', payment });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getActiveSessions = async (req, res) => {
    try {
        const sessions = await ParkingSession.find({ status: 'Active' }).populate('slot').populate('user', 'name vehicleNumber');
        res.status(200).json(sessions);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
