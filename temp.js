require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        const users = await User.find().select('name vehicleNumber alerts');
        console.log(JSON.stringify(users, null, 2));
        const slots = await mongoose.connection.collection('parkingslots').find().toArray();
        console.log("SLOTS:");
        console.log(JSON.stringify(slots.slice(0, 5), null, 2)); // Just first 5 to see
        process.exit();
    })
    .catch(console.error);
