document.addEventListener('DOMContentLoaded', () => {
    // If logged in, redirect to dashboard
    if (api.getToken()) {
        window.location.href = 'dashboard.html';
    }
});

function toggleAuth() {
    document.getElementById('loginForm').classList.toggle('active');
    document.getElementById('registerForm').classList.toggle('active');
}

function toggleVehicleInput() {
    const role = document.getElementById('regRole').value;
    const vehicleGroup = document.getElementById('vehicleGroup');
    if (role === 'User') {
        vehicleGroup.style.display = 'flex';
    } else {
        vehicleGroup.style.display = 'none';
        document.getElementById('regVehicle').value = '';
    }
}

async function handleAuth(e, type) {
    e.preventDefault();
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Loading...';
    btn.disabled = true;

    try {
        let payload;
        let endpoint;

        if (type === 'login') {
            payload = {
                email: document.getElementById('loginEmail').value,
                password: document.getElementById('loginPassword').value
            };
            endpoint = '/auth/login';
        } else {
            payload = {
                name: document.getElementById('regName').value,
                email: document.getElementById('regEmail').value,
                password: document.getElementById('regPassword').value,
                role: document.getElementById('regRole').value,
                vehicleNumber: document.getElementById('regVehicle').value,
                userType: document.getElementById('regUserType').value
            };
            endpoint = '/auth/register';
        }

        const data = await api.request(endpoint, 'POST', payload);

        api.setToken(data.token);
        localStorage.setItem('user', JSON.stringify({
            id: data._id,
            name: data.name,
            role: data.role,
            userType: data.userType
        }));

        showToast('Success! Redirecting...');
        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 1000);

    } catch (error) {
        // Error already handled by api.js
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
}
