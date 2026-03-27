/**
 * Bill / Invoice Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const orderId = urlParams.get('orderId');
    const billType = urlParams.get('type') || 'Invoice';

    if (!orderId) {
        showError('No order ID provided!');
        return;
    }

    try {
        // Try fetching from server first (orderId here is the MongoDB _id passed from admin.js)
        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
            const order = await response.json();
            generateInvoice(order, billType);
        } else {
            // Fallback to localStorage if server fetch fails
            const orders = JSON.parse(localStorage.getItem('arbudaOrders')) || [];
            const order = orders.find(o => o.orderId === orderId);

            if (!order) {
                showError('Order not found!');
                return;
            }
            generateInvoice(order, billType);
        }
    } catch (err) {
        console.error('Failed to fetch order from server:', err);
        showError('Could not connect to server.');
    }
});

function showError(msg) {
    const container = document.getElementById('billContainer');
    if (container) {
        container.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <p style="color: #ff4444; font-size: 1.2rem; margin-bottom: 20px;">${msg}</p>
                <a href="admin.html" class="btn btn-primary">Back to Admin</a>
            </div>
        `;
    }
}

function generateInvoice(order, billType = 'Invoice') {
    const container = document.getElementById('billContainer');
    if (!container) return;

    const invoiceDate = new Date().toLocaleDateString();
    const subtotal = parseFloat(order.totalAmount);
    const tax = (subtotal * 0.18).toFixed(2); // 18% GST
    const total = (subtotal + parseFloat(tax)).toFixed(2);

    const isPackingSlip = billType.toLowerCase() === 'packing slip';
    const isReceipt = billType.toLowerCase() === 'receipt';

    container.innerHTML = `
        <div class="bill-header">
            <div class="company-info">
                <h1>Arbuda Fashion</h1>
                <p>G-52, Shukan Plaza</p>
                <p>Vadgam, Gujarat 385410</p>
                <p>Phone: +91 98765 43210</p>
                <p>Email: contact@arbudafashion.com</p>
            </div>
            <div class="invoice-info" style="position: relative;">
                <h2>${billType.toUpperCase()}</h2>
                
                ${isReceipt ? '<div class="stamp stamp-paid">PAID</div>' : ''}
                ${order.status?.toLowerCase() === 'shipped' || order.status?.toLowerCase() === 'delivered' ? '<div class="stamp stamp-shipped">SHIPPED</div>' : ''}
                ${!isReceipt && !isPackingSlip && order.status?.toLowerCase() === 'pending' ? '<div class="stamp stamp-confirmed">RECEIVED</div>' : ''}

                <p><strong>${billType} #:</strong> ${order.orderId}</p>
                <p><strong>Date:</strong> ${invoiceDate}</p>
                <p><strong>Order Date:</strong> ${order.orderDate || new Date(order.createdAt).toLocaleString()}</p>
            </div>
        </div>

        <div class="bill-to">
            <h3>Bill To:</h3>
            <p><strong>${order.customerName}</strong></p>
            <p>${order.customerAddress}</p>
            <p>Phone: ${order.customerPhone}</p>
            <p>Email: ${order.customerEmail}</p>
        </div>

        <table class="bill-table">
            <thead>
                <tr>
                    <th>Product</th>
                    <th>Size</th>
                    ${!isPackingSlip ? '<th>Price</th>' : ''}
                    <th>Qty</th>
                    ${!isPackingSlip ? '<th>Amount</th>' : ''}
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>${order.product}</td>
                    <td>${order.size}</td>
                    ${!isPackingSlip ? `<td>₹${order.productPrice}</td>` : ''}
                    <td>${order.quantity}</td>
                    ${!isPackingSlip ? `<td>₹${order.totalAmount}</td>` : ''}
                </tr>
            </tbody>
        </table>

        ${!isPackingSlip ? `
        <div class="bill-summary">
            <div class="summary-table">
                <div class="summary-row">
                    <span>Subtotal:</span>
                    <span>₹${subtotal.toFixed(2)}</span>
                </div>
                <div class="summary-row">
                    <span>GST (18%):</span>
                    <span>₹${tax}</span>
                </div>
                <div class="summary-row total">
                    <span>Total:</span>
                    <span>₹${total}</span>
                </div>
            </div>
        </div>
        ` : `
        <div class="packing-note" style="margin-top: 20px; padding: 15px; border: 1px dashed #ccc; border-radius: 4px;">
            <p><strong>Note:</strong> This is a packing slip for shipment purposes. No pricing information is included as per standard procedure.</p>
        </div>
        `}

        <div class="bill-footer" style="margin-top: ${isPackingSlip ? '100px' : '40px'};">
            <p><strong>Thank you for your business!</strong></p>
            <p>For any queries, please email us at contact@arbudafashion.com</p>
            <p style="margin-top: 20px; font-size: 0.85rem;">This is a computer-generated ${billType.toLowerCase()}.</p>
        </div>
    `;

    document.title = `${billType} - Arbuda Fashion`;
}
