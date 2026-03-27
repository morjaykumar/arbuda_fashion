const API_BASE_URL = (window.location.protocol === 'http:' || window.location.protocol === 'https:')
    ? '/api'
    : 'https://arbuda-fashion.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    // Auth Check
    let user = null;
    try {
        user = JSON.parse(localStorage.getItem('arbudaUser'));
    } catch (e) {
        console.error('Auth error:', e);
    }

    if (!user || user.role !== 'admin') {
        alert('Access denied. Admins only.');
        window.location.href = 'login.html';
        return;
    }

    // ─── State ────────────────────────────────────────────────────────────────
    let isEditing = false;
    let editId = null;
    let allOrders = [];
    let currentOrderId = null;
    let currentOrderFilter = 'all';

    // ─── Elements ─────────────────────────────────────────────────────────────
    const productForm = document.getElementById('addProductForm');
    const productList = document.getElementById('adminProductList');
    const formTitle = document.getElementById('productFormTitle');
    const submitBtn = productForm ? productForm.querySelector('button[type="submit"]') : null;
    const cancelEditBtn = document.getElementById('cancelEditBtn');
    const orderList = document.getElementById('adminOrderList');
    const orderModal = document.getElementById('orderDetailsModal');
    const orderDetailsContent = document.getElementById('orderDetailsContent');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    const orderStatusSelect = document.getElementById('orderStatusSelect');
    const userList = document.getElementById('adminUserList');
    const searchInput = document.getElementById('orderSearch');

    // ─── DB Connection Badge ──────────────────────────────────────────────────
    checkConnection();

    // ─── Initial Load ─────────────────────────────────────────────────────────
    loadDashboardStats();
    loadProducts();
    loadOrders();
    loadUsers();

    // ─── Tab Navigation ───────────────────────────────────────────────────────
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.admin-tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.admin-tab-panel').forEach(p => p.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.tab).classList.add('active');
        });
    });

    // ─── Connection Check ─────────────────────────────────────────────────────
    async function checkConnection() {
        const badge = document.createElement('div');
        badge.id = 'dbStatus';
        badge.style.cssText = 'position:fixed;bottom:20px;right:20px;padding:10px 20px;border-radius:50px;font-weight:bold;font-size:0.85rem;z-index:9999;box-shadow:0 4px 15px rgba(0,0,0,0.15);transition:all 0.3s ease;';
        badge.textContent = '⏳ Connecting...';
        badge.style.background = '#f39c12'; badge.style.color = 'white';
        document.body.appendChild(badge);
        try {
            const res = await fetch(`${API_BASE_URL}/products`);
            if (res.ok) {
                badge.style.background = '#27ae60';
                badge.textContent = '🟢 Database Connected';
                setTimeout(() => { badge.style.opacity = '0.6'; }, 3000);
            } else throw new Error();
        } catch {
            badge.style.background = '#e74c3c';
            badge.textContent = '🔴 Database Disconnected';
        }
    }

    // ─── Dashboard Stats ──────────────────────────────────────────────────────
    async function loadDashboardStats() {
        console.log(' Loading dashboard stats...');
        try {
            // Fetch everything with individual error handling
            const fetchJson = async (url) => {
                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.json();
                } catch (e) {
                    console.warn(`⚠️ Failed to fetch ${url}:`, e);
                    return null;
                }
            };

            const [products, orders, users] = await Promise.all([
                fetchJson(`${API_BASE_URL}/products`),
                fetchJson(`${API_BASE_URL}/orders`),
                fetchJson(`${API_BASE_URL}/users`)
            ]);

            const prodArr = Array.isArray(products) ? products : [];
            const orderArr = Array.isArray(orders) ? orders : [];
            const userArr = Array.isArray(users) ? users : [];

            const totalRevenue = orderArr.reduce((s, o) => s + (o.totalAmount || 0), 0);
            const pendingOrders = orderArr.filter(o => o.status === 'Pending').length;
            const deliveredOrders = orderArr.filter(o => o.status === 'Delivered').length;
            const lowStock = prodArr.filter(p => p.stock < 5).length;
            const outOfStock = prodArr.filter(p => p.stock === 0).length;

            // ── Update Main Dashboard Stats ──
            setText('statTotalProducts', prodArr.length);
            setText('statTotalOrders', orderArr.length);
            setText('statTotalRevenue', '₹' + totalRevenue.toLocaleString());
            setText('statTotalUsers', userArr.length);
            setText('statPendingOrders', pendingOrders);
            setText('statDelivered', deliveredOrders);
            setText('statLowStock', lowStock);
            setText('statOutOfStock', outOfStock);

            // ── Update Analytics Tab Stats (Duplicate IDs in HTML) ──
            setText('statTotalRevenue2', '₹' + totalRevenue.toLocaleString());
            setText('statTotalProducts2', prodArr.length);
            setText('statDelivered2', deliveredOrders);
            setText('statPendingOrders2', pendingOrders);

            console.log('✅ Dashboard stats updated successfully.');
        } catch (err) {
            console.error('❌ Critical dashboard stats error:', err);
        }
    }

    function setText(id, val) {
        const el = document.getElementById(id);
        if (el) el.textContent = val;
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // PRODUCTS
    // ═══════════════════════════════════════════════════════════════════════════
    if (productForm) {
        productForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productData = {
                name: document.getElementById('productName').value.trim(),
                price: parseFloat(document.getElementById('productPrice').value),
                image: document.getElementById('productImage').value.trim(),
                category: document.getElementById('productCategory').value,
                description: document.getElementById('productDesc').value.trim(),
                stock: parseInt(document.getElementById('productStock').value)
            };

            if (!productData.name || !productData.price || !productData.category) {
                showToast('Please fill all required fields.', 'error'); return;
            }

            try {
                const url = isEditing ? `${API_BASE_URL}/products/${editId}` : `${API_BASE_URL}/products`;
                const method = isEditing ? 'PATCH' : 'POST';
                const res = await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(productData)
                });
                if (res.ok) {
                    showToast(isEditing ? '✅ Product updated!' : '✅ Product added!', 'success');
                    resetProductForm();
                    setTimeout(() => { loadProducts(); loadDashboardStats(); }, 400);
                } else {
                    const d = await res.json();
                    showToast('❌ ' + (d.message || 'Failed to save product'), 'error');
                }
            } catch {
                showToast('🔴 Server not responding. Run "npm run dev".', 'error');
            }
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', resetProductForm);
    }

    async function loadProducts() {
        if (!productList) return;
        productList.innerHTML = '<p class="empty-state">Loading products...</p>';
        try {
            const res = await fetch(`${API_BASE_URL}/products`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const products = await res.json();

            if (!Array.isArray(products) || !products.length) {
                productList.innerHTML = '<p class="empty-state">No products yet. Add one above!</p>';
                return;
            }
            productList.innerHTML = '';
            products.slice().reverse().forEach(p => {
                const stockClass = p.stock === 0 ? 'stock-out' : p.stock < 10 ? 'stock-low' : 'stock-good';
                const div = document.createElement('div');
                div.className = 'product-item-compact';
                div.innerHTML = `
                    <img src="${p.image}" onerror="this.src='https://placehold.co/60x60?text=No+Img'" class="product-thumb">
                    <div class="product-details-compact">
                        <h4>${p.name}</h4>
                        <p>₹${p.price} &nbsp;|&nbsp; <span class="stock-badge ${stockClass}">Stock: ${p.stock}</span> &nbsp;|&nbsp; <em>${p.category}</em></p>
                        <p style="font-size:0.8rem;color:#888;">${p.description || ''}</p>
                    </div>
                    <div class="stock-controls">
                        <button class="stock-btn" onclick="adjustStock('${p._id}', 1)" title="Add Stock">+</button>
                        <span class="stock-display">${p.stock}</span>
                        <button class="stock-btn" onclick="adjustStock('${p._id}', -1)" title="Remove Stock">−</button>
                    </div>
                    <div class="action-buttons">
                        <button class="edit-btn" onclick="startEdit('${p._id}')">✏️ Edit</button>
                        <button class="delete-btn" onclick="deleteProduct('${p._id}')">🗑️ Delete</button>
                    </div>`;
                productList.appendChild(div);
            });
            updateProductDashboards(products);
        } catch {
            productList.innerHTML = '<p class="empty-state">Unable to load products. Check server.</p>';
        }
    }

    function updateProductDashboards(products) {
        const mostDemandedList = document.getElementById('mostDemandedList');
        if (mostDemandedList) {
            const top = [...products].sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0)).slice(0, 5);
            mostDemandedList.innerHTML = top.length
                ? top.map((p, i) => `<div class="product-item-compact"><span class="rank-badge">#${i + 1}</span><h4>${p.name}</h4><span class="demand-badge">Orders: ${p.orderCount || 0}</span></div>`).join('')
                : '<p class="empty-state">No order data yet.</p>';
        }
        const lowStockList = document.getElementById('lowStockList');
        if (lowStockList) {
            const low = products.filter(p => p.stock < 5);
            lowStockList.innerHTML = low.length
                ? low.map(p => `<div class="product-item-compact"><h4>${p.name}</h4><span class="stock-badge ${p.stock === 0 ? 'stock-out' : 'stock-low'}">Stock: ${p.stock}</span><button class="edit-btn" onclick="startEdit('${p._id}')">Restock</button></div>`).join('')
                : '<p class="empty-state">✅ All products have sufficient stock.</p>';
        }
    }

    window.adjustStock = async function (id, change) {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}/stock`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quantity: -change })
            });
            if (res.ok) { loadProducts(); loadDashboardStats(); }
        } catch { showToast('Stock update failed', 'error'); }
    };

    window.deleteProduct = async function (id) {
        if (!confirm('Delete this product permanently?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast('Product deleted.', 'success'); loadProducts(); loadDashboardStats(); }
            else showToast('Failed to delete.', 'error');
        } catch { showToast('Server error.', 'error'); }
    };

    const clearAllBtn = document.getElementById('clearAllProductsBtn');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async () => {
            if (!confirm('⚠️ WARNING: This will delete ALL products in the shop. Proceed?')) return;
            try {
                const res = await fetch(`${API_BASE_URL}/products`, { method: 'DELETE' });
                if (res.ok) {
                    showToast('All products removed.', 'success');
                    loadProducts(); loadDashboardStats();
                }
            } catch { showToast('Server error.', 'error'); }
        });
    }

    window.startEdit = async function (id) {
        try {
            const res = await fetch(`${API_BASE_URL}/products/${id}`);
            const product = await res.json();
            isEditing = true; editId = id;
            document.getElementById('productName').value = product.name;
            document.getElementById('productPrice').value = product.price;
            document.getElementById('productImage').value = product.image || '';
            document.getElementById('productCategory').value = product.category || '';
            document.getElementById('productDesc').value = product.description || '';
            document.getElementById('productStock').value = product.stock;
            if (formTitle) formTitle.textContent = '✏️ Edit Product';
            if (submitBtn) submitBtn.textContent = 'Update Product';
            if (cancelEditBtn) cancelEditBtn.style.display = 'inline-block';
            // Switch to products tab and scroll
            document.querySelector('[data-tab="productsTab"]')?.click();
            productForm.scrollIntoView({ behavior: 'smooth' });
        } catch { showToast('Could not load product.', 'error'); }
    };

    function resetProductForm() {
        isEditing = false; editId = null;
        if (productForm) productForm.reset();
        if (formTitle) formTitle.textContent = '➕ Add New Product';
        if (submitBtn) submitBtn.textContent = 'Add Product';
        if (cancelEditBtn) cancelEditBtn.style.display = 'none';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // ORDERS
    // ═══════════════════════════════════════════════════════════════════════════
    async function loadOrders() {
        if (!orderList) return;
        orderList.innerHTML = '<p class="empty-state">Loading orders...</p>';
        try {
            const res = await fetch(`${API_BASE_URL}/orders`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            allOrders = Array.isArray(data) ? data : [];
            renderOrders(allOrders);
            // Update modal-related stats if present
            setText('totalOrders', allOrders.length);
            setText('pendingOrders', allOrders.filter(o => o.status === 'Pending').length);
            setText('completedOrders', allOrders.filter(o => o.status === 'Delivered').length);
        } catch (err) {
            console.error('Order load error:', err);
            orderList.innerHTML = '<p class="empty-state">Failed to load orders.</p>';
        }
    }

    function renderOrders(orders) {
        if (!orderList) return;
        const filtered = currentOrderFilter === 'all'
            ? orders
            : orders.filter(o => o.status === currentOrderFilter);

        if (!filtered.length) {
            orderList.innerHTML = '<p class="empty-state">No orders found.</p>'; return;
        }
        orderList.innerHTML = `
            <table class="order-table">
                <thead><tr><th>Order ID</th><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Status</th><th>Date</th><th>Actions</th></tr></thead>
                <tbody>${filtered.map(o => `
                    <tr>
                        <td><strong>${o.orderId}</strong></td>
                        <td>${o.customerName}<br><small>${o.customerEmail}</small></td>
                        <td>${o.product}</td>
                        <td>${o.quantity}</td>
                        <td>₹${o.totalAmount}</td>
                        <td><span class="status-badge status-${(o.status || '').toLowerCase()}">${o.status}</span></td>
                        <td><small>${new Date(o.createdAt).toLocaleDateString()}</small></td>
                        <td>
                            <button class="view-btn" onclick="viewOrderDetails('${o._id}')">View</button>
                            <button class="bill-btn" onclick="createBill('${o._id}', 'Invoice')">Invoice</button>
                            <button class="bill-btn" onclick="createBill('${o._id}', 'Packing Slip')" style="background:#666;">Packing</button>
                            <button class="delete-btn" onclick="deleteOrder('${o._id}')" style="font-size:0.75rem;">Delete</button>
                        </td>
                    </tr>`).join('')}
                </tbody>
            </table>`;
    }

    // Order filter buttons
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.status;
            renderOrders(allOrders);
        });
    });

    // Order search
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            const filtered = allOrders.filter(o =>
                o.orderId.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerEmail.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q)
            );
            renderOrders(filtered);
        });
    }

    window.viewOrderDetails = async function (id) {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}`);
            const order = await res.json();
            currentOrderId = id;
            orderDetailsContent.innerHTML = `
                <div class="order-details-grid">
                    <div><strong>Order ID:</strong><br>${order.orderId}</div>
                    <div><strong>Date:</strong><br>${new Date(order.createdAt).toLocaleString()}</div>
                    <div><strong>Status:</strong><br><span class="status-badge status-${(order.status || '').toLowerCase()}">${order.status}</span></div>
                    <div><strong>Customer:</strong><br>${order.customerName}</div>
                    <div><strong>Email:</strong><br>${order.customerEmail}</div>
                    <div><strong>Phone:</strong><br>${order.customerPhone || '—'}</div>
                    <div><strong>Product:</strong><br>${order.product}</div>
                    <div><strong>Qty × Size:</strong><br>${order.quantity} × ${order.size || '—'}</div>
                    <div><strong>Total:</strong><br>₹${order.totalAmount}</div>
                    <div style="grid-column:1/-1"><strong>Delivery Address:</strong><br>${order.customerAddress || '—'}</div>
                </div>`;
            if (orderStatusSelect) orderStatusSelect.value = order.status;
            switchModalTab('manage');
            orderModal.style.display = 'flex';
        } catch { showToast('Error loading order.', 'error'); }
    };

    if (updateStatusBtn) {
        updateStatusBtn.addEventListener('click', async () => {
            if (!currentOrderId) return;
            try {
                const res = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/status`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ status: orderStatusSelect.value })
                });
                if (res.ok) {
                    showToast('Status updated!', 'success');
                    orderModal.style.display = 'none';
                    loadOrders(); loadDashboardStats();
                } else showToast('Failed to update status.', 'error');
            } catch { showToast('Server error.', 'error'); }
        });
    }

    window.deleteOrder = async function (id) {
        if (!confirm('Delete this order permanently?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast('Order deleted.', 'success'); loadOrders(); loadDashboardStats(); }
            else showToast('Failed to delete order.', 'error');
        } catch { showToast('Server error.', 'error'); }
    };

    window.switchModalTab = function (tabName) {
        document.querySelectorAll('.modal-tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('onclick')?.includes(tabName));
        });
        document.querySelectorAll('.modal-tab-panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === tabName + 'Tab');
        });
    };

    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.style.display = 'none';
            currentOrderId = null;
        });
    });

    window.createBill = function (orderId, type = 'Invoice') {
        window.open(`bill.html?orderId=${orderId}&type=${type}`, '_blank');
    };

    // ═══════════════════════════════════════════════════════════════════════════
    // USERS
    // ═══════════════════════════════════════════════════════════════════════════
    async function loadUsers() {
        if (!userList) return;
        userList.innerHTML = '<p class="empty-state">Loading users...</p>';
        try {
            const res = await fetch(`${API_BASE_URL}/users`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const users = await res.json();
            if (!Array.isArray(users) || !users.length) { userList.innerHTML = '<p class="empty-state">No users found.</p>'; return; }
            userList.innerHTML = `
                <table class="order-table">
                    <thead><tr><th>Name</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr></thead>
                    <tbody>${users.map(u => `
                        <tr>
                            <td>${u.name}</td>
                            <td>@${u.username}</td>
                            <td>${u.email}</td>
                            <td><span class="status-badge ${u.role === 'admin' ? 'status-delivered' : 'status-pending'}">${u.role}</span></td>
                            <td><span class="status-badge ${u.isActive !== false ? 'status-delivered' : 'status-cancelled'}">${u.isActive !== false ? 'Active' : 'Blocked'}</span></td>
                            <td><small>${new Date(u.createdAt).toLocaleDateString()}</small></td>
                            <td>${u.role !== 'admin' ? `
                                <button class="edit-btn" onclick="toggleUserStatus('${u._id}', ${u.isActive !== false})">${u.isActive !== false ? '🚫 Block' : '✅ Unblock'}</button>
                                <button class="delete-btn" onclick="deleteUser('${u._id}')">🗑️ Delete</button>
                            ` : '<em>Admin</em>'}</td>
                        </tr>`).join('')}
                    </tbody>
                </table>`;
        } catch { userList.innerHTML = '<p class="empty-state">Failed to load users.</p>'; }
    }

    window.toggleUserStatus = async function (id, currentlyActive) {
        const action = currentlyActive ? 'block' : 'unblock';
        if (!confirm(`Are you sure you want to ${action} this user?`)) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !currentlyActive })
            });
            if (res.ok) { showToast(`User ${action}ed.`, 'success'); loadUsers(); }
            else showToast('Failed to update user status.', 'error');
        } catch { showToast('Server error.', 'error'); }
    };

    window.deleteUser = async function (id) {
        if (!confirm('Delete this user permanently?')) return;
        try {
            const res = await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
            if (res.ok) { showToast('User deleted.', 'success'); loadUsers(); loadDashboardStats(); }
            else showToast('Failed to delete user.', 'error');
        } catch { showToast('Server error.', 'error'); }
    };

    // ─── Toast Notification ───────────────────────────────────────────────────
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
