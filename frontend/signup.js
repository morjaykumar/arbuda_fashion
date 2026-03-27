/**
 * signup.js — Arbuda Fashion
 * Handles: User registration form
 */

const API_BASE = 'http://localhost:5050/api';

document.addEventListener('DOMContentLoaded', () => {
    redirectIfLoggedIn();

    const signupForm = document.getElementById('signupForm');
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
});

/* ── Redirect if already logged in ── */
function redirectIfLoggedIn() {
    const user = JSON.parse(localStorage.getItem('arbudaUser') || 'null');
    if (user) window.location.href = 'index.html';
}

/* ── Register user (calls backend directly) ── */
async function registerUser(name, email, phone, username, password) {
    try {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, phone, username, password })
        });

        const data = await res.json();

        if (!res.ok) {
            showMessage(data.message || 'Registration failed. Please try again.', 'error');
            return false;
        }

        return true;

    } catch (err) {
        showMessage('Cannot connect to server. Make sure the server is running.', 'error');
        return false;
    }
}

/* ── Form Submit Handler ── */
async function handleSignup(e) {
    e.preventDefault();
    const form = e.target;

    // Read fields — note: HTML id is "fullname" but backend needs "name"
    const name = document.getElementById('fullname').value.trim();
    const email = document.getElementById('email').value.trim();
    const phone = document.getElementById('signupPhone').value.trim();
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;

    // Validation
    if (!name) return showMessage('Full name is required.', 'error');
    if (!phone) return showMessage('Phone number is required.', 'error');
    if (!username) return showMessage('Username is required.', 'error');
    if (!password || password.length < 4) return showMessage('Password must be at least 4 characters.', 'error');
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return showMessage('Please enter a valid email address.', 'error');
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating Account...';

    const success = await registerUser(name, email, phone, username, password);

    if (success) {
        showMessage('Account created! Redirecting to login...', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 1800);
    }

    submitBtn.disabled = false;
    submitBtn.textContent = 'Create Account';
}

/* ── Message Helper ── */
function showMessage(msg, type = 'error') {
    const existing = document.getElementById('auth-msg');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.id = 'auth-msg';
    div.textContent = msg;
    div.style.cssText = `
        padding: 10px 16px;
        border-radius: 8px;
        margin-bottom: 14px;
        font-size: 14px;
        text-align: center;
        background: ${type === 'success' ? '#d1fae5' : '#fee2e2'};
        color:      ${type === 'success' ? '#065f46' : '#991b1b'};
        border: 1px solid ${type === 'success' ? '#6ee7b7' : '#fca5a5'};
    `;
    const form = document.getElementById('signupForm');
    form.parentNode.insertBefore(div, form);
}
