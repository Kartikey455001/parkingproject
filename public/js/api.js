const API_BASE = 'http://localhost:5000/api';

const api = {
    setToken(token) {
        localStorage.setItem('token', token);
    },
    getToken() {
        return localStorage.getItem('token');
    },
    getUser() {
        return JSON.parse(localStorage.getItem('user'));
    },
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },
    async request(endpoint, method = 'GET', data = null) {
        const headers = { 'Content-Type': 'application/json' };
        const token = this.getToken();
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const config = { method, headers };
        if (data) config.body = JSON.stringify(data);

        try {
            const res = await fetch(`${API_BASE}${endpoint}`, config);
            const jsonData = await res.json();
            if (!res.ok) throw new Error(jsonData.message || 'API request failed');
            return jsonData;
        } catch (error) {
            showToast(error.message, true);
            throw error;
        }
    }
};

function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    if (isError) toast.classList.add('error');
    else toast.classList.remove('error');

    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
