let currentUser = null;
let currentSlots = [];
let selectedSlotId = null;

document.addEventListener('DOMContentLoaded', () => {
    if (!api.getToken()) {
        window.location.href = 'index.html';
        return;
    }

    currentUser = api.getUser();
    document.getElementById('profileName').textContent = currentUser.name;

    let profileDesc = currentUser.role;
    if (currentUser.role === 'User') {
        profileDesc += ' (' + (currentUser.userType || 'Student') + ')';
    }
    document.getElementById('profileRole').textContent = profileDesc;

    setupClock();
    buildNavLinks();

    // Load default view based on role
    if (currentUser.role === 'Admin') loadAdminDashboard();
    else if (currentUser.role === 'ParkingStaff') loadStaffDashboard();
    else {
        loadUserDashboard();
        startAlertPolling();
    }
});

function startAlertPolling() {
    setInterval(async () => {
        try {
            const user = await api.request('/auth/me');
            if (user && user.alerts && user.alerts.length > 0) {
                const unread = user.alerts.filter(a => !a.read);
                if (unread.length > 0) {
                    unread.forEach(alert => {
                        window.alert(`🚨 PARKING ALERT 🚨\n\n${alert.message}`);
                    });
                    await api.request('/auth/me/alerts/read', 'PUT');
                }
            }
        } catch (e) {
            console.error('Alert polling error:', e);
        }
    }, 5000);
}

function logout() {
    api.logout();
}

function setupClock() {
    setInterval(() => {
        document.getElementById('liveClock').textContent = new Date().toLocaleTimeString();
    }, 1000);
}

function buildNavLinks() {
    const ul = document.getElementById('navLinks');
    ul.innerHTML = '';

    if (currentUser.role === 'Admin') {
        ul.innerHTML += `<li onclick="loadAdminDashboard()"><i class="fas fa-chart-line"></i> Dashboard</li>`;
        ul.innerHTML += `<li onclick="loadAdminUsers()"><i class="fas fa-users"></i> Manage Users</li>`;
        ul.innerHTML += `<li onclick="loadAdminSlots()"><i class="fas fa-th"></i> Manage Slots</li>`;
        ul.innerHTML += `<li onclick="loadAdminPricing()"><i class="fas fa-tags"></i> Pricing Config</li>`;
        ul.innerHTML += `<li onclick="loadReports()"><i class="fas fa-exclamation-triangle"></i> Reports</li>`;
    }

    if (currentUser.role === 'ParkingStaff' || currentUser.role === 'Admin') {
        ul.innerHTML += `<li onclick="loadStaffDashboard()"><i class="fas fa-clipboard-check"></i> Ops Desk</li>`;
        if (currentUser.role === 'ParkingStaff') {
            ul.innerHTML += `<li onclick="loadReports()"><i class="fas fa-exclamation-triangle"></i> Reports</li>`;
        }
    }

    if (currentUser.role === 'User') {
        ul.innerHTML += `<li onclick="loadUserDashboard()"><i class="fas fa-parking"></i> Book Parking</li>`;
        ul.innerHTML += `<li onclick="loadMyBookings()"><i class="fas fa-history"></i> My Bookings</li>`;
    }
    ul.innerHTML += `<li onclick="loadAlerts()"><i class="fas fa-bell"></i> Alerts</li>`;
}

// ----------------------------------------------------
// Views
// ----------------------------------------------------

async function loadUserDashboard() {
    document.getElementById('pageTitle').textContent = 'Live Parking Tower';
    const main = document.getElementById('mainContent');
    const tpl = document.getElementById('towerTemplate').content.cloneNode(true);
    main.innerHTML = '';
    main.appendChild(tpl);
    await fetchAndRenderSlots();
}

async function loadAlerts() {
    document.getElementById('pageTitle').textContent = 'My Alerts';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading Alerts...</h2>';
    try {
        const user = await api.request('/auth/me');
        const alerts = user.alerts || [];
        alerts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        let html = `
            <div class="glass-panel" style="padding: 20px;">
                <h2>All Notifications</h2>
                <div style="margin-top: 15px;">
                    ${alerts.length === 0 ? '<p>No alerts found.</p>' : ''}
                    ${alerts.map(a => `
                        <div style="background: ${a.read ? 'rgba(255,255,255,0.05)' : 'rgba(255, 68, 68, 0.2)'}; 
                                    padding: 15px; border-radius: 8px; margin-bottom: 10px;
                                    border-left: 4px solid ${a.read ? 'gray' : 'var(--danger)'};">
                            <p style="margin: 0; font-weight: ${a.read ? '300' : '600'};">${a.message}</p>
                            <small style="color: var(--text-secondary);">${new Date(a.createdAt).toLocaleString()}</small>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        main.innerHTML = html;
        if (alerts.filter(a => !a.read).length > 0) {
            await api.request('/auth/me/alerts/read', 'PUT');
        }
    } catch (e) {
        main.innerHTML = `<div class="glass-panel"><p class="warning-text">${e.message}</p></div>`;
    }
}

async function loadStaffDashboard() {
    document.getElementById('pageTitle').textContent = 'Staff Operations';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading Operations...</h2>';

    try {
        const bookings = await api.request('/bookings/all');
        const sessions = await api.request('/parking/active');

        let html = `
            <div class="stats-grid">
                <div class="stat-card glass-panel">
                    <h3>Manual Check-in</h3>
                    <input type="text" id="checkinBookingId" placeholder="Booking ID">
                    <button class="btn primary-btn" onclick="handleCheckIn()">Check In</button>
                </div>
                <div class="stat-card glass-panel">
                    <h3>Manual Check-out</h3>
                    <input type="text" id="checkoutSessionId" placeholder="Session ID">
                    <button class="btn primary-btn" onclick="handleCheckOut()">Check Out & Bill</button>
                </div>
            </div>
            
            <div class="glass-panel" style="padding: 20px; margin-top:20px">
                <h2>Active Parking Sessions (Check-ins)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Session ID</th>
                            <th>User (Vehicle)</th>
                            <th>Slot Number</th>
                            <th>Check-in Time</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${sessions.map(s => `
                            <tr>
                                <td><code>${s._id}</code></td>
                                <td>${s.user.name} (${s.user.vehicleNumber})</td>
                                <td>${s.slot.slotNumber}</td>
                                <td>${new Date(s.checkInTime).toLocaleString()}</td>
                                <td><button class="btn secondary-btn" onclick="document.getElementById('checkoutSessionId').value='${s._id}'">Select</button></td>
                            </tr>
                        `).join('')}
                        ${sessions.length === 0 ? '<tr><td colspan="5">No active sessions</td></tr>' : ''}
                    </tbody>
                </table>
            </div>

            <div class="glass-panel" style="padding: 20px; margin-top: 20px;">
                <h2>Incoming Reservations (Verify & Check-in)</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Booking ID</th>
                            <th>User</th>
                            <th>Slot</th>
                            <th>Vehicle</th>
                            <th>Reserved Until</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${bookings.filter(b => b.status === 'Active').map(b => `
                            <tr>
                                <td><code>${b._id}</code></td>
                                <td>${b.user ? b.user.name : '-'}</td>
                                <td>${b.slot ? b.slot.slotNumber : 'N/A'}</td>
                                <td>${b.user ? (b.user.vehicleNumber || '-') : '-'}</td>
                                <td>${new Date(b.reservationExpiry).toLocaleString()}</td>
                                <td><button class="btn secondary-btn" onclick="document.getElementById('checkinBookingId').value='${b._id}'">Select ID</button></td>
                            </tr>
                        `).join('')}
                        ${bookings.filter(b => b.status === 'Active').length === 0 ? '<tr><td colspan="6">No pending reservations</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
        main.innerHTML = html;
    } catch (e) {
        console.error(e);
        main.innerHTML = `<p class="warning-text">Failed to load staff operations: ${e.message}</p>`;
    }
}

async function loadAdminDashboard() {
    document.getElementById('pageTitle').textContent = 'Admin Analytics';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading Stats...</h2>';
    try {
        const { stats } = await api.request('/admin/dashboard');
        main.innerHTML = `
            <div class="stats-grid">
                <div class="stat-card glass-panel"><h3>Total Slots</h3><div class="value">${stats.totalSlots}</div></div>
                <div class="stat-card glass-panel"><h3>Occupied Slots</h3><div class="value" style="color:var(--danger)">${stats.occupiedSlots}</div></div>
                <div class="stat-card glass-panel"><h3>Available Slots</h3><div class="value" style="color:var(--success)">${stats.availableSlots}</div></div>
                <div class="stat-card glass-panel"><h3>Reserved Slots</h3><div class="value" style="color:var(--warning)">${stats.reservedSlots}</div></div>
                <div class="stat-card glass-panel"><h3>Daily Revenue</h3><div class="value" style="color:var(--accent-color)">$${stats.dailyRevenue}</div></div>
            </div>
            <div class="glass-panel" style="padding: 20px">
                <h2>Quick Setup</h2>
                <div style="display:flex; gap: 10px; margin-top:20px;">
                    <button class="btn primary-btn" onclick="seedSlots()">Generate Standard Slots</button>
                </div>
            </div>
        `;
    } catch (e) { console.error(e); }
}

async function loadAdminUsers() {
    document.getElementById('pageTitle').textContent = 'User Management';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading Users...</h2>';
    try {
        const users = await api.request('/admin/users');
        let html = `
            <div class="glass-panel" style="padding: 20px">
                <h2>System Users</h2>
                <table>
                    <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Type</th><th>Vehicle</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${users.map(u => `
                            <tr>
                                <td>${u.name}</td>
                                <td>${u.email}</td>
                                <td>
                                    <select onchange="updateUserRole('${u._id}', this.value)">
                                        <option value="User" ${u.role === 'User' ? 'selected' : ''}>User</option>
                                        <option value="ParkingStaff" ${u.role === 'ParkingStaff' ? 'selected' : ''}>ParkingStaff</option>
                                        <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Admin</option>
                                    </select>
                                </td>
                                <td>${u.userType}</td>
                                <td>${u.vehicleNumber || '-'}</td>
                                <td><button class="btn danger-btn" onclick="deleteUser('${u._id}')">Delete</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        main.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function updateUserRole(id, role) {
    if (!confirm(`Change role to ${role}?`)) return;
    try {
        await api.request(`/admin/users/${id}`, 'PUT', { role });
        showToast('Role updated');
    } catch (e) { showToast(e.message, true); }
}

async function deleteUser(id) {
    if (!confirm('Delete user permanent?')) return;
    try {
        await api.request(`/admin/users/${id}`, 'DELETE');
        showToast('User deleted');
        loadAdminUsers();
    } catch (e) { showToast(e.message, true); }
}

async function loadAdminSlots() {
    document.getElementById('pageTitle').textContent = 'Slot Management';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading...</h2>';
    try {
        const slots = await api.request('/slots');
        let html = `
            <div class="glass-panel" style="padding: 20px; margin-bottom:20px">
                <h2>Add New Slot</h2>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <div class="input-group" style="margin-bottom:0"><label>Slot #</label><input type="text" id="newSlotNum" placeholder="A1"></div>
                    <div class="input-group" style="margin-bottom:0"><label>Type</label><select id="newSlotType"><option value="Student">Student</option><option value="Staff">Staff</option></select></div>
                    <div class="input-group" style="margin-bottom:0"><label>EV?</label><input type="checkbox" id="newSlotEV"></div>
                    <button class="btn primary-btn" onclick="createNewSlot()">Create</button>
                </div>
            </div>
            <div class="glass-panel" style="padding: 20px">
                <h2>System Slots</h2>
                <table>
                    <thead><tr><th>Slot #</th><th>Type</th><th>EV</th><th>Status</th><th>Vehicle</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${slots.map(s => `
                            <tr>
                                <td>${s.slotNumber}</td>
                                <td>${s.slotType}</td>
                                <td>${s.hasEVCharger ? '⚡' : '-'}</td>
                                <td><span class="badge badge-${s.status.toLowerCase()}">${s.status}</span></td>
                                <td>${s.currentVehicleNumber || '-'}</td>
                                <td><button class="btn danger-btn" onclick="deleteSlot('${s._id}')">Delete</button></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        main.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function createNewSlot() {
    const slotNumber = document.getElementById('newSlotNum').value;
    const slotType = document.getElementById('newSlotType').value;
    const hasEVCharger = document.getElementById('newSlotEV').checked;
    if (!slotNumber) return showToast('Enter slot number', true);
    try {
        await api.request('/slots', 'POST', { slotNumber, slotType, hasEVCharger });
        showToast('Slot created');
        loadAdminSlots();
    } catch (e) { showToast(e.message, true); }
}

async function deleteSlot(id) {
    if (!confirm('Delete slot?')) return;
    try {
        await api.request(`/slots/${id}`, 'DELETE');
        showToast('Deleted');
        loadAdminSlots();
    } catch (e) { showToast(e.message, true); }
}

async function loadAdminPricing() {
    document.getElementById('pageTitle').textContent = 'Pricing Configuration';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading...</h2>';
    try {
        const settings = await api.request('/settings');
        let html = `
            <div class="glass-panel" style="padding: 20px">
                <h2>Dynamic System Rates</h2>
                <div style="margin-top:20px;">
                    ${settings.map(s => `
                        <div style="display:flex; justify-content:space-between; align-items:center; padding:15px; border-bottom:1px solid rgba(255,255,255,0.05)">
                            <div><h3 style="margin:0">${s.description}</h3><small>Key: ${s.key}</small></div>
                            <div style="display:flex; gap:10px">
                                <input type="number" step="0.1" value="${s.value}" id="set_${s.key}" style="width:80px; background:rgba(255,255,255,0.1); border:1px solid rgba(255,255,255,0.2); color:white; padding:5px; border-radius:4px;">
                                <button class="btn primary-btn" onclick="updatePricing('${s.key}')">Update</button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
        main.innerHTML = html;
    } catch (e) { console.error(e); }
}

async function updatePricing(key) {
    const value = document.getElementById('set_' + key).value;
    try {
        await api.request('/settings', 'PUT', { key, value: parseFloat(value) });
        showToast('Updated successfully');
    } catch (e) { showToast(e.message, true); }
}

async function loadMyBookings() {
    document.getElementById('pageTitle').textContent = 'My Bookings & History';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading...</h2>';
    try {
        const bookings = await api.request('/bookings');
        main.innerHTML = `
            <div class="glass-panel" style="padding: 20px">
                <h2>Reservations</h2>
                <table>
                    <thead><tr><th>ID</th><th>Slot</th><th>Time</th><th>Expiry</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>
                        ${bookings.map(b => `
                            <tr>
                                <td><code>${b._id}</code></td>
                                <td>${b.slot ? b.slot.slotNumber : 'N/A'}</td>
                                <td>${new Date(b.bookingTime).toLocaleString()}</td>
                                <td>${new Date(b.reservationExpiry).toLocaleString()}</td>
                                <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
                                <td>
                                    ${b.status === 'Active' ? `<button class="btn danger-btn" onclick="cancelBooking('${b._id}')">Cancel</button>` : ''}
                                    ${b.status === 'Completed' ? `<button class="btn secondary-btn" onclick="promptPayment('${b._id}')">Pay (Demo)</button>` : ''}
                                </td>
                            </tr>
                        `).join('')}
                        ${bookings.length === 0 ? '<tr><td colspan="6">No bookings found</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
            <div class="glass-panel" style="padding: 20px; margin-top: 20px;">
                <h2>Report Wrong Parking</h2>
                <div style="display:flex; gap:10px; align-items:flex-end;">
                    <div class="input-group" style="margin-bottom:0"><label>Slot</label><select id="reportSlotId"></select></div>
                    <div class="input-group" style="margin-bottom:0"><label>Vehicle #</label><input type="text" id="reportVehicle" placeholder="XYZ"></div>
                    <div class="input-group" style="margin-bottom:0; flex-grow:1"><label>Complaint</label><input type="text" id="reportDesc"></div>
                    <button class="btn danger-btn" onclick="submitReport()">Submit</button>
                </div>
            </div>
        `;
        const slots = await api.request('/slots');
        const select = document.getElementById('reportSlotId');
        slots.forEach(s => select.innerHTML += `<option value="${s._id}">${s.slotNumber}</option>`);
    } catch (e) { }
}

async function loadReports() {
    document.getElementById('pageTitle').textContent = 'Wrong Parking Reports';
    const main = document.getElementById('mainContent');
    main.innerHTML = '<h2>Loading Reports...</h2>';
    try {
        const reports = await api.request('/reports');
        main.innerHTML = `
            <div class="glass-panel" style="padding: 20px">
                <h2>User Reports</h2>
                <table>
                    <thead><tr><th>Report ID</th><th>Slot</th><th>Offending Vehicle</th><th>Complaint</th><th>Reporter</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
                        ${reports.map(r => `
                            <tr>
                                <td><code>${r._id}</code></td>
                                <td>${r.slot ? r.slot.slotNumber : 'N/A'}</td>
                                <td>${r.vehicleNumber}</td>
                                <td>${r.complaint}</td>
                                <td>${r.reporter ? r.reporter.name : 'Unknown'}</td>
                                <td><span class="badge badge-${r.status.toLowerCase()}">${r.status}</span></td>
                                <td>
                                    <button class="btn secondary-btn" onclick="updateReport('${r._id}', 'Reviewed')">Review</button>
                                    <button class="btn primary-btn" onclick="updateReport('${r._id}', 'Resolved')">Resolve</button>
                                </td>
                            </tr>
                        `).join('')}
                        ${reports.length === 0 ? '<tr><td colspan="7">No reports found</td></tr>' : ''}
                    </tbody>
                </table>
            </div>
        `;
    } catch (e) { console.error(e); }
}

async function updateReport(id, status) {
    if (!confirm(`Mark as ${status}?`)) return;
    try {
        await api.request(`/reports/${id}/status`, 'PUT', { status });
        showToast(`Marked as ${status}`);
        loadReports();
    } catch (e) { console.error(e); }
}

async function cancelBooking(id) {
    if (!confirm('Cancel this booking?')) return;
    try {
        await api.request(`/bookings/${id}/cancel`, 'PUT');
        showToast('Cancelled');
        loadMyBookings();
    } catch (e) { }
}

async function handleCheckIn() {
    const bookingId = document.getElementById('checkinBookingId').value;
    if (!bookingId) return showToast('Enter Booking ID', true);
    try {
        await api.request('/parking/checkin', 'POST', { bookingId });
        showToast('Checked In Successfully');
        document.getElementById('checkinBookingId').value = '';
        loadStaffDashboard();
    } catch (e) { showToast(e.message, true); }
}

async function handleCheckOut() {
    const sessionId = document.getElementById('checkoutSessionId').value;
    if (!sessionId) return showToast('Enter Session ID', true);
    try {
        const res = await api.request('/parking/checkout', 'POST', { sessionId });
        showToast(`Checked Out. Fee: Rs. ${res.fee}`);
        document.getElementById('checkoutSessionId').value = '';
        setTimeout(() => {
            if (confirm(`Proceed to payment of Rs. ${res.fee}?`)) {
                api.request('/parking/pay', 'POST', { sessionId, method: 'Card' })
                    .then(() => { showToast('Payment Successful'); loadStaffDashboard(); })
                    .catch(e => console.error(e));
            } else loadStaffDashboard();
        }, 1000);
    } catch (e) { showToast(e.message, true); }
}

async function submitReport() {
    const slotId = document.getElementById('reportSlotId').value;
    const vehicleNumber = document.getElementById('reportVehicle').value;
    const complaint = document.getElementById('reportDesc').value;
    if (!slotId || !vehicleNumber || !complaint) return showToast('Fill all fields', true);
    try {
        await api.request('/reports', 'POST', { slotId, vehicleNumber, complaint });
        showToast('Report submitted');
        document.getElementById('reportVehicle').value = '';
        document.getElementById('reportDesc').value = '';
    } catch (e) { }
}

window.promptPayment = function (bookingId) {
    showToast('Processing demo payment...');
    setTimeout(() => { showToast('Payment Successful!'); }, 1500);
}

// ----------------------------------------------------
// Tower
// ----------------------------------------------------

async function fetchAndRenderSlots() {
    try {
        currentSlots = await api.request('/slots');
        const levelsContainer = document.getElementById('towerLevels');
        if (!levelsContainer) return;
        levelsContainer.innerHTML = '';
        for (let i = 0; i < currentSlots.length; i += 10) {
            const levelSlots = currentSlots.slice(i, i + 10);
            const levelDiv = document.createElement('div');
            levelDiv.className = 'tower-level';
            levelSlots.forEach(slot => {
                const statusClass = slot.status ? slot.status.toLowerCase() : 'available';
                const isStaff = slot.slotType === 'Staff' ? 'staff' : '';
                const sl = document.createElement('div');
                sl.className = `parking-slot-ui ${statusClass} ${isStaff}`;
                let evIcon = slot.hasEVCharger ? `<i class="fas fa-bolt" style="position: absolute; top: 5px; right: 5px; color: var(--accent-color); font-size: 0.8rem;"></i>` : '';
                sl.innerHTML = `${evIcon}<div style="font-weight:bold; margin-bottom:5px">${slot.slotNumber}</div><i class="fas fa-car slot-car"></i>`;
                if (slot.status !== 'Available') {
                    sl.innerHTML += `<div style="font-size: 0.7rem; background: rgba(0,0,0,0.5); border-radius: 4px;">${slot.currentVehicleNumber || 'Busy'}</div>`;
                }
                sl.onclick = () => handleSlotClick(slot);
                levelDiv.appendChild(sl);
            });
            levelsContainer.appendChild(levelDiv);
        }
    } catch (e) { console.error(e); }
}

function handleSlotClick(slot) {
    if (slot.status !== 'Available') {
        const v = slot.currentVehicleNumber || 'Unknown';
        if (confirm(`Slot ${slot.slotNumber} is ${slot.status} by ${v}.\nReport wrong parking?`)) {
            const c = prompt(`Complaint for vehicle ${v}:`);
            if (c) api.request('/reports', 'POST', { slotId: slot._id, vehicleNumber: v, complaint: c }).then(() => showToast('Reported')).catch(e => showToast(e.message, true));
        }
        return;
    }
    if ((slot.slotType === 'Staff' || slot.hasEVCharger) && currentUser.userType !== 'Staff') return showToast('Staff Only', true);

    selectedSlotId = slot._id;
    document.getElementById('modalSlotTitle').textContent = `Book Slot ${slot.slotNumber}`;
    document.getElementById('modalVehicleText').textContent = currentUser.vehicleNumber || 'N/A';
    document.getElementById('bookingStartTime').value = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('bookingModal').classList.remove('hidden');

    document.getElementById('proceedToCheckoutBtn').onclick = () => {
        const hours = document.getElementById('bookingDuration').value;
        if (!hours || hours < 1 || hours > 48) return showToast('Invalid duration', true);

        api.request('/settings').then(settings => {
            const getS = (k) => settings.find(s => s.key === k)?.value;
            const rate = (getS('base_rate') || 5) * (currentUser.userType === 'Staff' ? (getS('staff_discount') || 0.8) : 1) + (slot.hasEVCharger ? (getS('ev_premium') || 0.4) : 0);

            const updateTotal = () => {
                const total = (rate * hours) + (document.getElementById('checkoutCarWash').checked ? (getS('car_wash_fee') || 15) : 0);
                document.getElementById('checkoutTotalCost').textContent = '$' + total.toFixed(2);
            };

            document.getElementById('checkoutSlotNumber').textContent = slot.slotNumber;
            document.getElementById('checkoutDuration').textContent = `${hours} hrs`;
            document.getElementById('checkoutRate').textContent = `$${rate.toFixed(2)} / hr`;
            document.getElementById('checkoutCarWash').onchange = updateTotal;
            updateTotal();

            document.getElementById('bookingModal').classList.add('hidden');
            document.getElementById('checkoutModal').classList.remove('hidden');

            document.getElementById('payNowBtn').onclick = async () => {
                document.getElementById('checkoutModal').classList.add('hidden');
                document.getElementById('paymentOverlay').classList.remove('hidden');
                try {
                    await api.request('/bookings', 'POST', { slotId: selectedSlotId, hoursToBook: hours, requestCarWash: document.getElementById('checkoutCarWash').checked, bookingTime: document.getElementById('bookingStartTime').value });
                    setTimeout(() => { document.getElementById('paymentOverlay').classList.add('hidden'); showToast('Success!'); fetchAndRenderSlots(); }, 1500);
                } catch (e) { document.getElementById('paymentOverlay').classList.add('hidden'); showToast(e.message, true); }
            };
        });
    };
}

async function seedSlots() {
    try {
        const old = await api.request('/slots');
        for (const s of old) await api.request(`/slots/${s._id}`, 'DELETE');
        for (let i = 1; i <= 50; i++) await api.request('/slots', 'POST', { slotNumber: `A${i}`, slotType: i >= 41 ? 'Staff' : 'Student' });
        showToast('Seeded!');
        location.reload();
    } catch (e) { showToast('Error', true); }
}
