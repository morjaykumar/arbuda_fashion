/**
 * Profile Page Logic - Full User Features
 */

const API_URL = 'http://localhost:5050';
const API_BASE_URL = `${API_URL}/api`;

document.addEventListener('DOMContentLoaded', () => {
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('arbudaUser'));
    } catch (e) {
        console.error('Auth error:', e);
    }

    if (!user) { window.location.href = 'login.html'; return; }

    // ─── State ────────────────────────────────────────────────────────────────
    let allUserOrders = [];
    let currentOrderFilter = 'all';

    // ─── Elements ─────────────────────────────────────────────────────────────
    const profileImage = document.getElementById('profileImage');
    const profileAvatar = document.getElementById('profileAvatar');
    const imageUpload = document.getElementById('imageUpload');
    const editAvatarLabel = document.getElementById('editAvatarLabel');
    const detailName = document.getElementById('detailName');
    const detailPhone = document.getElementById('detailPhone');
    const detailAddress = document.getElementById('detailAddress');
    const editBtn = document.getElementById('editBtn');
    const saveBtn = document.getElementById('saveBtn');
    const cancelBtn = document.getElementById('cancelBtn');

    // ─── Tab Navigation ───────────────────────────────────────────────────────
    document.querySelectorAll('.profile-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.profile-tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
            if (btn.dataset.tab === 'myOrdersTab') loadUserOrders();
        });
    });

    // ─── Load Profile ─────────────────────────────────────────────────────────
    function loadProfile() {
        document.getElementById('profileName').textContent = user.name || '—';
        document.getElementById('profileUsername').textContent = '@' + (user.username || 'user');
        detailName.value = user.name || '';
        document.getElementById('detailUsername').value = user.username || '';
        document.getElementById('detailEmail').value = user.email || '';
        detailPhone.value = user.phone || '';
        detailAddress.value = user.address || '';
        document.getElementById('detailRole').textContent = (user.role || 'user').toUpperCase();
        document.getElementById('detailJoined').textContent = user.createdAt
            ? new Date(user.createdAt).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            : '—';

        const roleBadge = document.getElementById('profileRoleBadge');
        if (roleBadge) {
            roleBadge.textContent = user.role === 'admin' ? '👑 Admin' : '👤 Customer';
            roleBadge.className = 'status-badge ' + (user.role === 'admin' ? 'status-delivered' : 'status-pending');
        }

        if (user.profileImage) {
            profileImage.src = user.profileImage;
            profileImage.style.display = 'block';
            profileAvatar.style.display = 'none';
        } else {
            profileImage.style.display = 'none';
            profileAvatar.style.display = 'flex';
            profileAvatar.textContent = (user.name || 'U').charAt(0).toUpperCase();
        }
    }
    loadProfile();

    // ─── Image Upload ─────────────────────────────────────────────────────────
    if (imageUpload) {
        imageUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 1.5 * 1024 * 1024) { showToast('Image too large (max 1.5MB).', 'error'); return; }
            const reader = new FileReader();
            reader.onload = (ev) => {
                profileImage.src = ev.target.result;
                profileImage.style.display = 'block';
                profileAvatar.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });
    }

    // ─── Edit Mode ────────────────────────────────────────────────────────────
    function toggleEditMode(enabled) {
        detailName.disabled = !enabled;

        const detailUsername = document.getElementById('detailUsername');
        detailUsername.disabled = !enabled;
        detailUsername.style.background = enabled ? 'white' : 'transparent';
        detailUsername.style.border = enabled ? '1px solid #ccc' : 'none';

        const detailEmail = document.getElementById('detailEmail');
        detailEmail.disabled = !enabled;
        detailEmail.style.background = enabled ? 'white' : 'transparent';
        detailEmail.style.border = enabled ? '1px solid #ccc' : 'none';

        detailPhone.disabled = !enabled;
        detailAddress.disabled = !enabled;
        if (editAvatarLabel) editAvatarLabel.style.display = enabled ? 'flex' : 'none';
        editBtn.style.display = enabled ? 'none' : 'inline-block';
        saveBtn.style.display = enabled ? 'inline-block' : 'none';
        cancelBtn.style.display = enabled ? 'inline-block' : 'none';
    }

    if (editBtn) editBtn.addEventListener('click', () => toggleEditMode(true));
    if (cancelBtn) cancelBtn.addEventListener('click', () => { loadProfile(); toggleEditMode(false); });

    // ─── Save Profile ─────────────────────────────────────────────────────────
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const newName = detailName.value.trim();
            if (!newName) { showToast('Name cannot be empty.', 'error'); return; }

            const newUsername = document.getElementById('detailUsername').value.trim();
            const newEmail = document.getElementById('detailEmail').value.trim();

            const updateData = {
                name: newName,
                username: newUsername,
                email: newEmail,
                phone: detailPhone.value.trim(),
                address: detailAddress.value.trim(),
                profileImage: profileImage.style.display === 'block' ? profileImage.src : ''
            };

            try {
                const userId = user.id || user._id;
                const res = await fetch(`${API_BASE_URL}/users/${userId}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updateData)
                });
                if (res.ok) {
                    const data = await res.json();
                    const updatedUser = { ...user, ...data.user };
                    localStorage.setItem('arbudaUser', JSON.stringify(updatedUser));
                    Object.assign(user, data.user);
                    loadProfile();
                    toggleEditMode(false);
                    showToast('✅ Profile updated!', 'success');
                } else {
                    showToast('Failed to update profile.', 'error');
                }
            } catch { showToast('Server connection error.', 'error'); }
        });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // MY ORDERS
    // ═══════════════════════════════════════════════════════════════════════════
    async function loadUserOrders() {
        const orderList = document.getElementById('userOrderList');
        if (!orderList) return;
        orderList.innerHTML = '<p class="empty-state">Loading your orders...</p>';
        try {
            const email = user.email;
            if (!email) { orderList.innerHTML = '<p class="empty-state">No email linked to your account.</p>'; return; }
            const res = await fetch(`${API_BASE_URL}/orders?email=${encodeURIComponent(email)}`);
            allUserOrders = await res.json();
            renderUserOrders();
        } catch { orderList.innerHTML = '<p class="empty-state">Failed to load orders.</p>'; }
    }

    function renderUserOrders() {
        const orderList = document.getElementById('userOrderList');
        const filtered = currentOrderFilter === 'all'
            ? allUserOrders
            : allUserOrders.filter(o => o.status === currentOrderFilter);

        if (!filtered.length) {
            orderList.innerHTML = `<p class="empty-state">${currentOrderFilter === 'all' ? "You haven't placed any orders yet." : 'No ' + currentOrderFilter + ' orders.'}</p>`;
            return;
        }

        orderList.innerHTML = filtered.map(o => `
            <div class="user-order-card">
                <div class="user-order-header">
                    <div>
                        <strong>${o.orderId}</strong>
                        <span class="status-badge status-${(o.status || '').toLowerCase()}" style="margin-left:10px;">${o.status}</span>
                    </div>
                    <small style="color:#888;">${new Date(o.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                </div>
                <div class="user-order-body">
                    <div class="user-order-detail"><span>Product</span><strong>${o.product}</strong></div>
                    <div class="user-order-detail"><span>Qty × Size</span><strong>${o.quantity} × ${o.size || '—'}</strong></div>
                    <div class="user-order-detail"><span>Total</span><strong>₹${o.totalAmount}</strong></div>
                    <div class="user-order-detail"><span>Address</span><span>${o.customerAddress || '—'}</span></div>
                </div>
                <div class="user-order-actions">
                    <button class="btn" onclick="window.open('bill.html?orderId=${o._id}&type=Invoice','_blank')" style="background:#555;color:white;padding:8px 16px;font-size:0.85rem;">🧾 Invoice</button>
                </div>
            </div>`).join('');
    }

    // Order filter buttons
    document.querySelectorAll('#myOrdersTab .order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#myOrdersTab .order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.status;
            renderUserOrders();
        });
    });

    // Cancel order functionality has been moved to admin-only.

    // ═══════════════════════════════════════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════════════════════════════════════
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const current = document.getElementById('currentPassword').value;
            const newPwd = document.getElementById('newPassword').value;
            const confirm = document.getElementById('confirmPassword').value;

            if (newPwd !== confirm) { showToast('New passwords do not match.', 'error'); return; }
            if (newPwd.length < 4) { showToast('Password must be at least 4 characters.', 'error'); return; }

            try {
                const userId = user.id || user._id;
                const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId, currentPassword: current, newPassword: newPwd })
                });
                const data = await res.json();
                if (res.ok) {
                    showToast('✅ Password changed!', 'success');
                    changePasswordForm.reset();
                } else {
                    showToast(data.message || 'Failed to change password.', 'error');
                }
            } catch { showToast('Server error.', 'error'); }
        });
    }

    const deleteAccountBtn = document.getElementById('deleteAccountBtn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', async () => {
            if (!confirm('⚠️ Delete your account permanently? All your data will be lost.')) return;
            if (!confirm('Are you absolutely sure? This CANNOT be undone.')) return;
            try {
                const userId = user.id || user._id;
                const res = await fetch(`${API_BASE_URL}/users/${userId}`, { method: 'DELETE' });
                if (res.ok) {
                    localStorage.removeItem('arbudaUser');
                    showToast('Account deleted.', 'success');
                    setTimeout(() => { window.location.href = 'index.html'; }, 1500);
                } else {
                    const data = await res.json();
                    showToast(data.message || 'Failed to delete account.', 'error');
                }
            } catch { showToast('Server error.', 'error'); }
        });
    }

    // ─── Toast ────────────────────────────────────────────────────────────────
    function showToast(msg, type = 'success') {
        const toast = document.createElement('div');
        toast.style.cssText = `position:fixed;top:90px;right:20px;padding:14px 24px;border-radius:8px;font-weight:600;font-size:0.9rem;z-index:99999;box-shadow:0 4px 20px rgba(0,0,0,0.15);transition:all 0.3s ease;max-width:320px;`;
        toast.style.background = type === 'success' ? '#27ae60' : '#e74c3c';
        toast.style.color = 'white';
        toast.textContent = msg;
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 3000);
    }
});
