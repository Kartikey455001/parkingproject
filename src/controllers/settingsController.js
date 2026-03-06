const Settings = require('../models/Settings');

exports.getSettings = async (req, res) => {
    try {
        const settings = await Settings.find();
        res.status(200).json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.updateSetting = async (req, res) => {
    try {
        const { key, value } = req.body;
        const setting = await Settings.findOneAndUpdate(
            { key },
            { value },
            { new: true, upsert: true }
        );
        res.status(200).json(setting);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

exports.initializeSettings = async () => {
    const defaults = [
        { key: 'base_rate', value: 5, description: 'Base parking rate per hour' },
        { key: 'staff_discount', value: 0.8, description: 'Multiplier for academic staff' },
        { key: 'ev_premium', value: 0.4, description: 'Additional multiplier for EV slots' },
        { key: 'car_wash_fee', value: 15, description: 'Flat fee for car wash service' }
    ];

    for (const d of defaults) {
        await Settings.findOneAndUpdate({ key: d.key }, d, { upsert: true });
    }
};
