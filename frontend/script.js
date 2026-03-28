// ─── Global Configuration ─────────────────────────────────────────────────────
window.API_BASE_URL = 'https://arbuda-fashion.onrender.com/api';

// ─── Run on every page load ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    initAuthUI();
    initNavigation();
    initMobileMenu();
    initSmoothScroll();
    protectPage();
});

// ─── Auth Helpers ─────────────────────────────────────────────────────────────
function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('arbudaUser'));
    } catch {
        return null;
    }
}

function initAuthUI() {
    const user = getCurrentUser();
    const adminLink = document.getElementById('adminNavLink');
    const logoutBtn = document.getElementById('logoutBtn');

    // ── Dynamic "Account" link: admin → admin.html, user → profile.html, guest → login.html ──
    const accountLinks = document.querySelectorAll('a.nav-link');
    accountLinks.forEach(link => {
        if (link.textContent.trim() === 'Account') {
            if (!user) {
                link.href = 'login.html';
            } else if (user.role === 'admin') {
                link.href = 'admin.html';
            } else {
                link.href = 'profile.html';
            }
        }
    });

    // Show Admin link only for admins
    if (user && user.role === 'admin' && adminLink) {
        adminLink.style.display = 'list-item';
    }

    // Show/hide Logout button based on login state
    if (logoutBtn) {
        if (!user) {
            // Not logged in: hide Logout, it's not needed
            logoutBtn.style.display = 'none';
        } else {
            logoutBtn.style.display = '';
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('arbudaUser');
                // Clean up any legacy keys
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = 'login.html';
            });
        }
    }
}

// ─── Page Protection ──────────────────────────────────────────────────────────
function protectPage() {
    const user = getCurrentUser();
    const path = window.location.pathname;

    // Pages that do NOT require login
    const publicPages = ['/', '/index.html', '/login.html', '/signup.html'];
    const isPublic = publicPages.some(p => path === p || path.endsWith(p));

    // Redirect unauthenticated users away from protected pages
    if (!user && !isPublic) {
        window.location.href = 'login.html';
        return;
    }

    // Block non-admins from admin panels
    const adminPages = ['/admin.html', '/admin-orders.html'];
    if (user && user.role !== 'admin' && adminPages.some(p => path.endsWith(p))) {
        alert('Access denied. Admins only.');
        window.location.href = 'index.html';
    }
}

// ─── Navigation: Scroll Shadow ────────────────────────────────────────────────
function initNavigation() {
    const header = document.querySelector('.header');
    if (!header) return;
    window.addEventListener('scroll', () => {
        header.classList.toggle('scrolled', window.scrollY > 50);
    });
}

// ─── Mobile Menu Toggle ───────────────────────────────────────────────────────
function initMobileMenu() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');
    if (!menuBtn || !nav) return;
    menuBtn.addEventListener('click', () => {
        nav.classList.toggle('active');
    });
}

// ─── Toast Notifications ───────────────────────────────────────────────────
function showToast(message, type = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Icon selection
    let icon = '✅';
    if (type === 'error') icon = '❌';
    if (type === 'info') icon = 'ℹ️';

    toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
    container.appendChild(toast);

    // Auto remove
    setTimeout(() => {
        toast.style.animation = 'toastSlideOut 0.4s ease forwards';
        setTimeout(() => toast.remove(), 400);
    }, 4000);
}

// Export to global window so other scripts can use it
window.showToast = showToast;

// ─── Smooth Scroll for anchor links ──────────────────────────────────────────
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// ─── File:// Protocol Warning ─────────────────────────────────────────────────
if (window.location.protocol === 'file:') {
    document.addEventListener('DOMContentLoaded', () => {
        const warning = document.createElement('div');
        warning.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:#e74c3c;color:white;text-align:center;padding:14px;z-index:99999;font-weight:600;font-size:0.95rem;';
        warning.innerHTML = '⚠️ Database won\'t work when opened as a file. Please use <a href="http://localhost:5050" style="color:white;text-decoration:underline;font-weight:bold;">http://localhost:5050</a> instead.';
        document.body.prepend(warning);
    });
}
