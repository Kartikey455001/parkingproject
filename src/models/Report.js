const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    slot: {
        type: mongoose.Schema.ObjectId,
        ref: 'ParkingSlot',
        required: true
    },
    vehicleNumber: {
        type: String,
        required: true
    },
    complaint: {
        type: String,
        required: true
    },
    reporter: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Reviewed', 'Resolved'],
        default: 'Pending'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Report', reportSchema);
