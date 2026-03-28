const API_BASE_URL = window.API_BASE_URL || 'http://localhost:5050/api';

document.addEventListener('DOMContentLoaded', () => {

    console.log(' Admin Orders Page Initialized');

    // ───── Simple Admin Check (Frontend Only) ─────
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

    // ───── State ─────
    let allOrders = [];
    let currentOrderId = null;
    let currentOrderFilter = 'all';

    // ───── Elements ─────
    const orderList = document.getElementById('adminOrderList');
    const orderModal = document.getElementById('orderDetailsModal');
    const orderDetailsContent = document.getElementById('orderDetailsContent');
    const updateStatusBtn = document.getElementById('updateStatusBtn');
    const orderStatusSelect = document.getElementById('orderStatusSelect');
    const searchInput = document.getElementById('orderSearch');

    // ───── Load Orders ─────
    async function loadOrders() {
        if (!orderList) return;

        orderList.innerHTML = '<div class="empty-state"><p>Loading orders...</p></div>';

        try {
            const res = await fetch(`${API_BASE_URL}/orders`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();
            allOrders = Array.isArray(data) ? data : [];

            // Update Dashboard Stats
            const totalOrdersEl = document.getElementById('totalOrders');
            const pendingOrdersEl = document.getElementById('pendingOrders');
            if (totalOrdersEl) totalOrdersEl.textContent = allOrders.length;
            if (pendingOrdersEl) pendingOrdersEl.textContent = allOrders.filter(o => o.status === 'Pending').length;

            renderOrders(allOrders);

        } catch (err) {
            console.error('Order load error:', err);
            orderList.innerHTML = '<div class="empty-state"><p>Failed to load orders.</p></div>';
        }
    }

    // ───── Render Orders ─────
    function renderOrders(orders) {
        const filtered = currentOrderFilter === 'all'
            ? orders
            : orders.filter(o => o.status === currentOrderFilter);

        if (!filtered.length) {
            orderList.innerHTML = '<div class="empty-state"><p>No orders found.</p></div>';
            return;
        }

        orderList.innerHTML = `
            <table class="order-table">
                <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${filtered.map(o => `
                        <tr>
                            <td>${o.orderId}</td>
                            <td>${o.customerName}<br><small>${o.customerEmail}</small></td>
                            <td>${o.product} (Qty: ${o.quantity})</td>
                            <td>₹${o.totalAmount}</td>
                            <td>${o.status}</td>
                            <td>${new Date(o.createdAt).toLocaleDateString()}</td>
                            <td>
                                <button onclick="viewOrderDetails('${o._id}')">Manage</button>
                                <button onclick="deleteOrder('${o._id}')">Delete</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // ───── View Order ─────
    window.viewOrderDetails = async function (id) {
        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}`);
            if (!res.ok) throw new Error();

            const order = await res.json();
            currentOrderId = id;

            orderDetailsContent.innerHTML = `
                <h3>${order.product}</h3>
                <p><strong>Order ID:</strong> ${order.orderId}</p>
                <p><strong>Customer:</strong> ${order.customerName}</p>
                <p><strong>Email:</strong> ${order.customerEmail}</p>
                <p><strong>Status:</strong> ${order.status}</p>
                <p><strong>Total:</strong> ₹${order.totalAmount}</p>
            `;

            orderStatusSelect.value = order.status;
            orderModal.style.display = 'flex';

        } catch (err) {
            alert('Error loading order details.');
        }
    };

    // ───── Update Status ─────
    updateStatusBtn?.addEventListener('click', async () => {
        if (!currentOrderId) return;

        const newStatus = orderStatusSelect.value;

        try {
            const res = await fetch(`${API_BASE_URL}/orders/${currentOrderId}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (!res.ok) throw new Error();

            orderModal.style.display = 'none';
            loadOrders();

        } catch {
            alert('Failed to update status.');
        }
    });

    // ───── Document Generation (Modal) ─────
    const modalInvoiceBtn = document.getElementById('modalInvoiceBtn');
    const modalPackingBtn = document.getElementById('modalPackingBtn');

    if (modalInvoiceBtn) {
        modalInvoiceBtn.addEventListener('click', () => {
            if (currentOrderId) window.open(`bill.html?orderId=${currentOrderId}&type=Invoice`, '_blank');
        });
    }

    if (modalPackingBtn) {
        modalPackingBtn.addEventListener('click', () => {
            if (currentOrderId) window.open(`bill.html?orderId=${currentOrderId}&type=Packing Slip`, '_blank');
        });
    }

    // ───── Delete Order ─────
    window.deleteOrder = async function (id) {
        if (!confirm('Delete this order?')) return;

        try {
            const res = await fetch(`${API_BASE_URL}/orders/${id}`, {
                method: 'DELETE'
            });

            if (!res.ok) throw new Error();

            loadOrders();

        } catch {
            alert('Delete failed.');
        }
    };

    // ───── Filter Buttons ─────
    document.querySelectorAll('.order-filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.order-filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentOrderFilter = btn.dataset.status;
            renderOrders(allOrders);
        });
    });

    // ───── Search ─────
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase();
            const filtered = allOrders.filter(o =>
                o.orderId.toLowerCase().includes(q) ||
                o.customerName.toLowerCase().includes(q) ||
                o.customerEmail.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q) ||
                (o.status || '').toLowerCase().includes(q)
            );
            renderOrders(filtered);
        });
    }

    // ───── Close Modal ─────
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            orderModal.style.display = 'none';
            currentOrderId = null;
        });
    });

    // ───── Initial Load ─────
    loadOrders();

});