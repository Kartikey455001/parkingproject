const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
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
    bookingTime: {
        type: Date,
        default: Date.now
    },
    reservationExpiry: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['Active', 'Completed', 'Cancelled', 'Expired'],
        default: 'Active'
    },
    totalCost: {
        type: Number,
        required: true,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Paid', 'Failed'],
        default: 'Pending'
    },
    requestCarWash: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Booking', bookingSchema);
