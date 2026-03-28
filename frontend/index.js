/**
 * Index Page Logic — Product Display, Filtering & Purchase
 */

const API_BASE_URL = '/api';

document.addEventListener('DOMContentLoaded', () => {
    // ─── State ────────────────────────────────────────────────────────────────
    let allProducts = [];
    let filterCategory = 'all';
    let searchQuery = '';
    let selectedProduct = null;

    // ─── Elements ─────────────────────────────────────────────────────────────
    const productGrid = document.querySelector('.product-grid');
    const emptyState = document.getElementById('empty-state-msg');
    const categoryBtns = document.querySelectorAll('.category-btn');
    const modal = document.getElementById('purchaseModal');
    const purchaseForm = document.getElementById('purchaseForm');
    const modalClose = document.querySelector('#purchaseModal .close-modal');
    const totalPriceSpan = document.getElementById('totalPrice');
    const qtyInput = document.getElementById('quantity');
    const searchInput = document.getElementById('productSearch');
    const refreshBtn = document.getElementById('refreshShopBtn');

    // ─── Load Products ────────────────────────────────────────────────────────
    async function fetchProducts() {
        if (!productGrid) return;

        productGrid.innerHTML = '<p style="text-align:center;color:#888;grid-column:1/-1;padding:40px;">Loading products...</p>';

        try {
            const res = await fetch(`${API_BASE_URL}/products`);
            if (!res.ok) throw new Error('Server error');
            allProducts = await res.json();
            renderProducts();
        } catch (err) {
            console.error('Fetch products error:', err);
            productGrid.innerHTML = `
                <div style="text-align:center;grid-column:1/-1;padding:40px;color:#888;">
                    <p>⚠️ Could not load products. Make sure the server is running.</p>
                    <p style="margin-top:10px;font-size:0.9rem;">Run <code>npm run dev</code> in your terminal.</p>
                </div>`;
        }
    }

    fetchProducts();

    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            fetchProducts();
            if (window.showToast) showToast('Catalog updated!', 'info');
        });
    }

    // ─── Render Products ──────────────────────────────────────────────────────
    function renderProducts() {
        if (!productGrid) return;

        const filtered = allProducts.filter(p => {
            const matchesCategory = filterCategory === 'all' ||
                (p.category || '').toLowerCase() === filterCategory.toLowerCase();

            const matchesSearch = !searchQuery ||
                p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (p.category || '').toLowerCase().includes(searchQuery.toLowerCase());

            return matchesCategory && matchesSearch;
        });

        productGrid.innerHTML = '';

        if (filtered.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            return;
        }
        if (emptyState) emptyState.style.display = 'none';

        const topIds = [...allProducts]
            .filter(p => (p.orderCount || 0) > 0)
            .sort((a, b) => (b.orderCount || 0) - (a.orderCount || 0))
            .slice(0, 5)
            .map(p => p._id);

        [...filtered].reverse().forEach(product => {
            const isTrending = topIds.includes(product._id);
            const isLowStock = product.stock > 0 && product.stock < 5;
            const isOutStock = product.stock <= 0;

            let badges = '';
            if (isTrending) badges += '<span class="badge badge-trending">🔥 Trending</span>';
            if (isLowStock) badges += '<span class="badge badge-low-stock">⚡ Limited</span>';
            if (isOutStock) badges += '<span class="badge badge-out-stock">Sold Out</span>';

            const card = document.createElement('div');
            card.className = 'product-card';
            card.innerHTML = `
                ${badges ? `<div class="badge-container">${badges}</div>` : ''}
                <div class="product-image-container">
                    <img src="${product.image || ''}" class="product-image" alt="${product.name}"
                         onerror="this.src='https://placehold.co/300x400?text=No+Image'">
                </div>
                <div class="product-content">
                    <p class="product-category">${product.category || 'Apparel'}</p>
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-description">${product.description || ''}</p>
                    <div class="product-footer">
                        <span class="product-price">₹${product.price.toLocaleString()}</span>
                        <button class="btn btn-buy" onclick="openPurchaseModal('${product._id}')" ${isOutStock ? 'disabled' : ''}>
                            ${isOutStock ? 'Available Soon' : 'Buy Now'}
                        </button>
                    </div>
                </div>`;
            productGrid.appendChild(card);
        });
    }

    // ─── Search Functionality ────────────────────────────────────────────────
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderProducts();
        });
    }

    // ─── Category Filter ──────────────────────────────────────────────────────
    categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            categoryBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            filterCategory = btn.dataset.category;
            renderProducts();
        });
    });

    // ─── Purchase Modal ───────────────────────────────────────────────────────
    window.openPurchaseModal = function (id) {
        const user = getCurrentUser();
        if (!user) {
            if (confirm('You need to be logged in to purchase. Go to login?')) {
                window.location.href = 'login.html';
            }
            return;
        }

        selectedProduct = allProducts.find(p => p._id === id);
        if (!selectedProduct) return;

        document.getElementById('modalProductInfo').innerHTML = `
            <div style="display:flex;gap:15px;align-items:center;">
                <img src="${selectedProduct.image}" style="width:80px;height:80px;border-radius:8px;object-fit:cover;"
                     onerror="this.src='https://placehold.co/80x80?text=No+Img'">
                <div>
                    <h3 style="margin:0;font-size:1.1rem;">${selectedProduct.name}</h3>
                    <p style="margin:5px 0;color:var(--accent-color);font-weight:600;">₹${selectedProduct.price.toLocaleString()}</p>
                    <p style="margin:0;font-size:0.85rem;color:#27ae60;">In Stock: ${selectedProduct.stock}</p>
                </div>
            </div>`;

        // Pre-fill user data
        document.getElementById('customerName').value = user.name || '';
        document.getElementById('customerEmail').value = user.email || '';
        document.getElementById('customerPhone').value = user.phone || '';
        document.getElementById('customerAddress').value = user.address || '';

        if (qtyInput) qtyInput.value = 1;
        updateTotal();
        modal.style.display = 'flex';
    };

    function updateTotal() {
        if (!selectedProduct || !totalPriceSpan) return;
        const qty = parseInt(qtyInput?.value) || 1;
        totalPriceSpan.textContent = (selectedProduct.price * qty).toLocaleString();
    }

    if (qtyInput) qtyInput.addEventListener('input', updateTotal);

    if (modalClose) {
        modalClose.addEventListener('click', () => { modal.style.display = 'none'; });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.style.display = 'none';
        });
    }

    // ─── Place Order ──────────────────────────────────────────────────────────
    if (purchaseForm) {
        purchaseForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!selectedProduct) return;

            const qty = parseInt(document.getElementById('quantity').value);
            if (qty < 1) { showToast('Please enter a valid quantity.', 'error'); return; }
            if (qty > selectedProduct.stock) {
                showToast(`Only ${selectedProduct.stock} units available.`, 'error'); return;
            }

            const submitBtn = purchaseForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Placing Order...';

            const orderData = {
                product: selectedProduct.name,
                productId: selectedProduct._id,
                productImage: selectedProduct.image,
                productPrice: selectedProduct.price,
                quantity: qty,
                size: document.getElementById('size').value,
                customerName: document.getElementById('customerName').value,
                customerEmail: document.getElementById('customerEmail').value,
                customerPhone: document.getElementById('customerPhone').value,
                customerAddress: document.getElementById('customerAddress').value,
                totalAmount: selectedProduct.price * qty
            };

            try {
                const res = await fetch(`${API_BASE_URL}/orders`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (res.ok) {
                    modal.style.display = 'none';
                    purchaseForm.reset();
                    showToast('🎉 Order placed successfully!', 'success');
                    setTimeout(() => {
                        window.location.href = 'profile.html';
                    }, 1500);
                    fetchProducts();
                } else {
                    const data = await res.json();
                    showToast(data.message || 'Failed to place order.', 'error');
                }
            } catch (err) {
                console.error('Order error:', err);
                showToast('Connection error. Is the server running?', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Confirm Order';
            }
        });
    }
});
