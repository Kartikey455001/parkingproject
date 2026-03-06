const mongoose = require('mongoose');

const parkingSlotSchema = new mongoose.Schema({
    slotNumber: {
        type: String,
        required: [true, 'Please provide a slot number'],
        unique: true
    },
    slotType: {
        type: String,
        enum: ['Student', 'Staff'],
        default: 'Student'
    },
    hasEVCharger: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: ['Available', 'Booked', 'Occupied'],
        default: 'Available'
    },
    currentVehicleNumber: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('ParkingSlot', parkingSlotSchema);
