const API_BASE_URL = (window.location.origin.startsWith('http'))
    ? '/api'
    : 'https://arbuda-fashion.onrender.com/api';

async function loginWithCredentials(credentials) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('arbudaUser', JSON.stringify(data.user));
            return true;
        } else {
            showToast(data.message || 'Login failed', 'error');
            return false;
        }

    } catch (err) {
        console.error('Login error:', err);
        showToast('Server connection error', 'error');
        return false;
    }
}

async function registerUser(name, email, phone, username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, username, password })
        });

        const data = await response.json();

        if (response.ok) {
            return true;
        } else {
            showToast(data.message || 'Registration failed', 'error');
            return false;
        }

    } catch (err) {
        console.error('Registration error:', err);
        showToast('Server connection error', 'error');
        return false;
    }
}

function showToast(msg, type = 'info') {
    // Remove any existing toast
    const existing = document.getElementById('auth-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.id = 'auth-toast';
    toast.textContent = msg;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 14px 24px;
        border-radius: 8px;
        font-size: 14px;
        z-index: 9999;
        color: #fff;
        background: ${type === 'success' ? '#059669' : type === 'error' ? '#dc2626' : '#2563eb'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        transition: opacity 0.3s;
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}