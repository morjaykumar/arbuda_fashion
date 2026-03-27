/**
 * login.js — Arbuda Fashion
 * Handles: Tab switching + Username login + Email login + OTP (Forgot Password) login
 */

const API_BASE = 'http://localhost:5050/api';

document.addEventListener('DOMContentLoaded', () => {
    redirectIfLoggedIn();
    initTabs();
    initUsernameLogin();
    initEmailLogin();
    initForgotPassword();
    initOtpFlow();
});

/* ── Redirect if already logged in ── */
function redirectIfLoggedIn() {
    const user = JSON.parse(localStorage.getItem('arbudaUser') || 'null');
    if (user) {
        window.location.href = user.role === 'admin' ? 'admin.html' : 'index.html';
    }
}

/* ── Tab Switching ── */
function initTabs() {
    const tabUsername = document.getElementById('tabUsername');
    const tabEmail = document.getElementById('tabEmail');
    const usernameForm = document.getElementById('usernameLoginForm');
    const emailForm = document.getElementById('emailLoginForm');

    if (!tabUsername || !tabEmail) return;

    tabUsername.addEventListener('click', () => {
        tabUsername.classList.add('active');
        tabEmail.classList.remove('active');
        usernameForm.style.display = 'block';
        emailForm.style.display = 'none';
        removeMessage();
    });

    tabEmail.addEventListener('click', () => {
        tabEmail.classList.add('active');
        tabUsername.classList.remove('active');
        emailForm.style.display = 'block';
        usernameForm.style.display = 'none';
        removeMessage();
    });
}

/* ── Core login function (calls backend) ── */
async function loginWithCredentials(credentials) {
    try {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials)
        });

        const data = await res.json();

        if (!res.ok) {
            showMessage(data.message || 'Invalid credentials. Please try again.', 'error');
            return false;
        }

        // Save user to localStorage (key must be 'arbudaUser' to match the rest of the app)
        localStorage.setItem('arbudaUser', JSON.stringify(data.user));

        showMessage('Login successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
        }, 1000);

        return true;

    } catch (err) {
        showMessage('Cannot connect to server. Make sure the server is running.', 'error');
        return false;
    }
}

/* ── Username Login ── */
function initUsernameLogin() {
    const form = document.getElementById('usernameLoginForm');
    const btn = document.getElementById('usernameLoginBtn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('usernamePassword').value;

        if (!username || !password) {
            return showMessage('Please enter username and password.', 'error');
        }

        btn.disabled = true;
        btn.textContent = 'Logging in...';

        await loginWithCredentials({ username, password });

        btn.disabled = false;
        btn.textContent = 'Login';
    });
}

/* ── Email Login ── */
function initEmailLogin() {
    const form = document.getElementById('emailLoginForm');
    const btn = document.getElementById('emailLoginBtn');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('emailPassword').value;

        if (!email || !password) {
            return showMessage('Please enter email and password.', 'error');
        }

        btn.disabled = true;
        btn.textContent = 'Logging in...';

        await loginWithCredentials({ email, password });

        btn.disabled = false;
        btn.textContent = 'Login';
    });
}


/* ══════════════════════════════════════
   FORGOT PASSWORD → OTP LOGIN FLOW
══════════════════════════════════════ */

let otpEmail = ''; // track the email OTP was sent to

/* ── Show OTP section when "Forgot Password?" is clicked ── */
function initForgotPassword() {
    const link1 = document.getElementById('forgotPwdLink1');
    const link2 = document.getElementById('forgotPwdLink2');
    const backLink = document.getElementById('backToLoginLink');

    const showOtp = (e) => {
        e.preventDefault();
        removeMessage();
        document.getElementById('usernameLoginForm').style.display = 'none';
        document.getElementById('emailLoginForm').style.display = 'none';
        document.querySelector('.login-tabs').style.display = 'none';
        document.getElementById('otpSection').style.display = 'block';

        // Reset OTP section
        document.getElementById('otpStep1').style.display = 'block';
        document.getElementById('otpStep2').style.display = 'none';
        document.getElementById('otpEmail').value = '';
        document.getElementById('otpCode').value = '';
    };

    const hideOtp = (e) => {
        e.preventDefault();
        removeMessage();
        document.getElementById('otpSection').style.display = 'none';
        document.querySelector('.login-tabs').style.display = 'flex';
        document.getElementById('usernameLoginForm').style.display = 'block';
        document.getElementById('emailLoginForm').style.display = 'none';

        // Reset tabs
        document.getElementById('tabUsername').classList.add('active');
        document.getElementById('tabEmail').classList.remove('active');
    };

    if (link1) link1.addEventListener('click', showOtp);
    if (link2) link2.addEventListener('click', showOtp);
    if (backLink) backLink.addEventListener('click', hideOtp);
}

/* ── OTP Send & Verify Logic ── */
function initOtpFlow() {
    const sendBtn = document.getElementById('sendOtpBtn');
    const verifyBtn = document.getElementById('verifyOtpBtn');
    const resendLink = document.getElementById('resendOtpLink');

    if (!sendBtn) return;

    /* ── Step 1: Send OTP ── */
    async function sendOtp() {
        const emailInput = document.getElementById('otpEmail');
        const email = emailInput.value.trim();

        if (!email) {
            return showMessage('Please enter your email address.', 'error');
        }

        sendBtn.disabled = true;
        sendBtn.textContent = 'Sending...';
        removeMessage();

        try {
            const res = await fetch(`${API_BASE}/auth/send-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await res.json();

            if (!res.ok) {
                showMessage(data.message || 'Failed to send code.', 'error');
                sendBtn.disabled = false;
                sendBtn.textContent = 'Send Verification Code';
                return;
            }

            // Success → move to step 2
            otpEmail = email;
            document.getElementById('otpStep1').style.display = 'none';
            document.getElementById('otpStep2').style.display = 'block';
            document.getElementById('otpSentMsg').textContent = `✅ Code sent to ${email}. Check your inbox!`;
            document.getElementById('otpCode').focus();

        } catch (err) {
            showMessage('Cannot connect to server. Make sure the server is running.', 'error');
        }

        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Verification Code';
    }

    sendBtn.addEventListener('click', sendOtp);

    /* ── Resend OTP ── */
    if (resendLink) {
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            if (!otpEmail) return;

            resendLink.textContent = 'Sending...';
            resendLink.style.pointerEvents = 'none';

            try {
                const res = await fetch(`${API_BASE}/auth/send-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: otpEmail })
                });

                const data = await res.json();

                if (res.ok) {
                    document.getElementById('otpSentMsg').textContent = `✅ New code sent to ${otpEmail}!`;
                    document.getElementById('otpCode').value = '';
                    document.getElementById('otpCode').focus();
                } else {
                    showMessage(data.message || 'Failed to resend.', 'error');
                }
            } catch (err) {
                showMessage('Cannot connect to server.', 'error');
            }

            resendLink.textContent = 'Resend Code';
            resendLink.style.pointerEvents = 'auto';
        });
    }

    /* ── Step 2: Verify OTP ── */
    if (verifyBtn) {
        verifyBtn.addEventListener('click', async () => {
            const otp = document.getElementById('otpCode').value.trim();

            if (!otp || otp.length < 6) {
                return showMessage('Please enter the full 6-digit code.', 'error');
            }

            verifyBtn.disabled = true;
            verifyBtn.textContent = 'Verifying...';
            removeMessage();

            try {
                const res = await fetch(`${API_BASE}/auth/verify-otp`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: otpEmail, otp })
                });

                const data = await res.json();

                if (!res.ok) {
                    showMessage(data.message || 'Verification failed.', 'error');
                    verifyBtn.disabled = false;
                    verifyBtn.textContent = 'Verify & Login';
                    return;
                }

                // Success — save credentials and redirect
                localStorage.setItem('arbudaUser', JSON.stringify(data.user));

                showMessage('✅ Login successful! Redirecting...', 'success');

                setTimeout(() => {
                    window.location.href = data.user.role === 'admin' ? 'admin.html' : 'index.html';
                }, 1000);

            } catch (err) {
                showMessage('Cannot connect to server.', 'error');
                verifyBtn.disabled = false;
                verifyBtn.textContent = 'Verify & Login';
            }
        });
    }
}


/* ══════════════════════════════════════
   MESSAGE HELPERS
══════════════════════════════════════ */

function showMessage(msg, type = 'error') {
    removeMessage();
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

    // Insert message in the visible section
    const otpSection = document.getElementById('otpSection');
    if (otpSection && otpSection.style.display !== 'none') {
        otpSection.insertBefore(div, otpSection.firstChild);
    } else {
        const card = document.querySelector('.auth-card');
        const tabs = document.querySelector('.login-tabs');
        if (card && tabs) {
            card.insertBefore(div, tabs.nextSibling);
        }
    }
}

function removeMessage() {
    const existing = document.getElementById('auth-msg');
    if (existing) existing.remove();
}
