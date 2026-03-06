const Report = require('../models/Report');
const User = require('../models/User');

exports.createReport = async (req, res) => {
    try {
        const { slotId, vehicleNumber, complaint } = req.body;
        const report = await Report.create({
            slot: slotId,
            vehicleNumber,
            complaint,
            reporter: req.user.id
        });

        // Simulate notification alert
        console.log(`[ALERT] Owner of vehicle ${vehicleNumber}: Your vehicle is reported for incorrect parking in slot. Please move it immediately.`);

        // Case-insensitive vehicle search
        const rx = new RegExp(`^\\s*${vehicleNumber.trim()}\\s*$`, 'i');
        const reportedUser = await User.findOne({ vehicleNumber: rx });

        if (reportedUser) {
            console.log(`[ALERT] Matched user ${reportedUser.name} for vehicle ${vehicleNumber}`);
            reportedUser.alerts.push({
                message: `URGENT: Your vehicle ${vehicleNumber} has been reported for wrong parking! Complaint: ${complaint}`
            });
            await reportedUser.save();
        }

        res.status(201).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.find().populate('slot').populate('reporter', 'name');
        res.status(200).json(reports);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateReportStatus = async (req, res) => {
    try {
        const report = await Report.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
        if (!report) return res.status(404).json({ message: 'Report not found' });
        res.status(200).json(report);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};
