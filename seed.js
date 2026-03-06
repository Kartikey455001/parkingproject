const http = require('http');

const options = { hostname: 'localhost', port: 5000, headers: { 'Content-Type': 'application/json' } };

function makeRequest(method, path, body, token) {
    return new Promise((resolve, reject) => {
        const reqOpts = { ...options, method, path };
        if (token) reqOpts.headers['Authorization'] = `Bearer ${token}`;

        const req = http.request(reqOpts, res => {
            let data = '';
            res.on('data', c => data += c);
            res.on('end', () => resolve({ status: res.statusCode, body: data ? JSON.parse(data) : null }));
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function run() {
    try {
        // First login with existing admin to clear data (or create if missing)
        let loginRes = await makeRequest('POST', '/api/auth/login', { email: 'ADMIN@gmail.com', password: 'ADMIN123' });

        // If first login fails, try to register the admin first
        if (loginRes.status !== 200) {
            await makeRequest('POST', '/api/auth/register', { name: 'Admin', email: 'ADMIN@gmail.com', password: 'ADMIN123', role: 'Admin' });
            loginRes = await makeRequest('POST', '/api/auth/login', { email: 'ADMIN@gmail.com', password: 'ADMIN123' });
        }

        const token = loginRes.body.token;

        // Ensure Parking Staff exists
        await makeRequest('POST', '/api/auth/register', { name: 'Parking Staff', email: 'parkingstaff@gmail.com', password: 'Parkingstaff123', role: 'ParkingStaff' });

        const oldSlotsReq = await makeRequest('GET', '/api/slots', null, token);
        const oldSlots = oldSlotsReq.body;
        for (const slot of oldSlots) {
            await makeRequest('DELETE', `/api/slots/${slot._id}`, null, token);
        }

        for (let i = 1; i <= 50; i++) {
            const slotType = i >= 31 ? 'Staff' : 'Student';
            const hasEVCharger = i >= 31 && i <= 40; // Generate EV Chargers on row 4
            const req = await makeRequest('POST', '/api/slots', { slotNumber: `A${i}`, slotType, hasEVCharger }, token);
            if (req.status !== 201) console.error(`Error on A${i}:`, req.body);
            else console.log(`Created A${i} (${slotType}) ${hasEVCharger ? '⚡ EV' : ''}`);
        }
        console.log('Success! ParkingStaff and Admin accounts verified, and slots recreated.');
    } catch (e) {
        console.error(e);
    }
}
run();
