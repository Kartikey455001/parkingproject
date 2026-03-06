const mongoose = require('mongoose');

const parkingSessionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    slot: {
        type: mongoose.Schema.ObjectId,
        ref: 'ParkingSlot',
        required: true
    },
    booking: {
        type: mongoose.Schema.ObjectId,
        ref: 'Booking'
    },
    checkInTime: {
        type: Date,
        required: true
    },
    checkOutTime: {
        type: Date
    },
    fee: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['Active', 'Completed'],
        default: 'Active'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ParkingSession', parkingSessionSchema);
