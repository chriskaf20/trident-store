/**
 * Email Templates
 * HTML templates for various transactional emails
 */

// Base layout template
function emailLayout(content: string, title: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; padding: 20px 0; border-bottom: 2px solid #f0f0f0; }
        .content { padding: 30px 0; }
        .footer { text-align: center; padding: 20px 0; border-top: 1px solid #f0f0f0; color: #666; font-size: 12px; }
        .button { display: inline-block; padding: 12px 24px; background-color: #1f2937; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        .button:hover { background-color: #111827; }
        .order-details { background-color: #f9fafb; padding: 15px; border-radius: 6px; margin: 20px 0; }
        .status-badge { display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: 600; font-size: 12px; }
        .status-pending { background-color: #fef3c7; color: #92400e; }
        .status-confirmed { background-color: #d1fae5; color: #065f46; }
        .status-processing { background-color: #bfdbfe; color: #1e40af; }
        .status-shipped { background-color: #a78bfa; color: #5b21b6; }
        .status-delivered { background-color: #86efac; color: #166534; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>${title}</h2>
        </div>
        <div class="content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; 2026 Trident Store. All rights reserved.</p>
            <p><a href="https://tridentstore.com/unsubscribe" style="color: #666;">Unsubscribe</a></p>
        </div>
    </div>
</body>
</html>
    `
}

// Order confirmation email
export function orderConfirmationEmail(orderData: {
    orderId: string
    customerName: string
    items: Array<{ name: string; quantity: number; price: number }>
    total: number
    deliveryMethod: string
    address: string
}): string {
    const itemsHtml = orderData.items
        .map(item => `
            <tr>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${item.name}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: center;">×${item.quantity}</td>
                <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">₹${item.price.toFixed(2)}</td>
            </tr>
        `)
        .join('')

    const content = `
        <p>Hi ${orderData.customerName},</p>
        
        <p>Thank you for your order! We've received it and are getting it ready to ship.</p>
        
        <div class="order-details">
            <h3>Order #${orderData.orderId}</h3>
            <p><strong>Delivery Method:</strong> ${orderData.deliveryMethod === 'cod' ? 'Cash on Delivery' : 'In-Store Pickup'}</p>
            <p><strong>Delivery Address:</strong> ${orderData.address}</p>
            
            <table style="width: 100%; margin: 20px 0;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left;">Product</th>
                        <th style="padding: 10px; text-align: center;">Qty</th>
                        <th style="padding: 10px; text-align: right;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f9fafb;">
                        <td colspan="2" style="padding: 10px; text-align: right;"><strong>Total:</strong></td>
                        <td style="padding: 10px; text-align: right;"><strong>₹${orderData.total.toFixed(2)}</strong></td>
                    </tr>
                </tfoot>
            </table>
        </div>
        
        <p>We'll notify you as soon as your order ships. You can track your order anytime:</p>
        <a href="https://tridentstore.com/profile/orders" class="button">View Order Status</a>
        
        <p>If you have any questions, please contact us at support@tridentstore.com</p>
    `

    return emailLayout(content, 'Order Confirmed')
}

// Order status update email
export function orderStatusUpdateEmail(orderData: {
    orderId: string
    customerName: string
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered'
    trackingNumber?: string
    estimatedDelivery?: string
}): string {
    const statusMessages: Record<string, string> = {
        confirmed: 'Your order has been confirmed and is being prepared for shipment.',
        processing: 'Your order is being processed and will ship soon.',
        shipped: 'Your order has been shipped! Track your package below.',
        delivered: 'Your order has been delivered. We hope you love it!'
    }

    const statusBadgeClass = `status-${orderData.status}`

    const content = `
        <p>Hi ${orderData.customerName},</p>
        
        <p>${statusMessages[orderData.status]}</p>
        
        <div class="order-details">
            <h3>Order #${orderData.orderId}</h3>
            <p>
                <strong>Status:</strong> 
                <span class="status-badge ${statusBadgeClass}" style="text-transform: capitalize;">
                    ${orderData.status}
                </span>
            </p>
            
            ${orderData.trackingNumber ? `
                <p><strong>Tracking Number:</strong> ${orderData.trackingNumber}</p>
                <a href="https://tridentstore.com/orders/${orderData.orderId}/track" class="button">Track Package</a>
            ` : ''}
            
            ${orderData.estimatedDelivery ? `
                <p><strong>Estimated Delivery:</strong> ${orderData.estimatedDelivery}</p>
            ` : ''}
        </div>
        
        <a href="https://tridentstore.com/profile/orders" class="button">View All Orders</a>
    `

    return emailLayout(content, 'Order Status Update')
}

// Vendor approval email
export function vendorApprovalEmail(vendorData: {
    vendorName: string
    storeName: string
}): string {
    const content = `
        <p>Hi ${vendorData.vendorName},</p>
        
        <p>Great news! Your vendor application for <strong>${vendorData.storeName}</strong> has been approved! 🎉</p>
        
        <p>You can now start uploading products and managing your store. Here's what you can do:</p>
        
        <ul>
            <li>Create and upload products</li>
            <li>Manage inventory</li>
            <li>Track orders and customer feedback</li>
            <li>View sales analytics</li>
        </ul>
        
        <a href="https://tridentstore.com/dashboard" class="button">Go to Vendor Dashboard</a>
        
        <p>If you have any questions, check out our <a href="https://tridentstore.com/docs/vendor">vendor documentation</a> or contact us at support@tridentstore.com</p>
    `

    return emailLayout(content, 'Welcome to Trident Store!')
}

// Vendor rejection email
export function vendorRejectionEmail(vendorData: {
    vendorName: string
    storeName: string
    reason?: string
}): string {
    const content = `
        <p>Hi ${vendorData.vendorName},</p>
        
        <p>Thank you for your interest in joining Trident Store. Unfortunately, we're unable to approve your application for <strong>${vendorData.storeName}</strong> at this time.</p>
        
        ${vendorData.reason ? `
            <p><strong>Reason:</strong></p>
            <p>${vendorData.reason}</p>
        ` : ''}
        
        <p>You're welcome to reapply after addressing any concerns. Feel free to reach out to us at support@tridentstore.com if you have any questions.</p>
        
        <a href="https://tridentstore.com/vendor-apply" class="button">Reapply</a>
    `

    return emailLayout(content, 'Application Status Update')
}

// Low stock alert (for vendors)
export function lowStockAlertEmail(vendorData: {
    vendorName: string
    products: Array<{ name: string; available: number; reserved: number }>
}): string {
    const productsList = vendorData.products
        .map(p => `
            <li>${p.name} - <strong>${p.available}</strong> available (${p.reserved} reserved)</li>
        `)
        .join('')

    const content = `
        <p>Hi ${vendorData.vendorName},</p>
        
        <p>Several products in your store are running low on inventory:</p>
        
        <ul>
            ${productsList}
        </ul>
        
        <p>We recommend restocking these items to avoid missed sales.</p>
        
        <a href="https://tridentstore.com/dashboard/products" class="button">Update Inventory</a>
    `

    return emailLayout(content, 'Low Stock Alert')
}

// Newsletter welcome
export function newsletterWelcomeEmail(subscriberData: {
    name?: string
}): string {
    const content = `
        <p>Hi${subscriberData.name ? ' ' + subscriberData.name : ''},</p>
        
        <p>Welcome to the Trident Store newsletter! 📬</p>
        
        <p>You're now subscribed to receive:</p>
        <ul>
            <li>Exclusive deals and discounts</li>
            <li>New collection launches</li>
            <li>Fashion tips and trends</li>
            <li>Special vendor collaborations</li>
        </ul>
        
        <a href="https://tridentstore.com" class="button">Shop Now</a>
        
        <p>Looking forward to sharing the latest fashion with you!</p>
    `

    return emailLayout(content, 'Welcome to Trident Store')
}

// Password reset (if implemented)
export function passwordResetEmail(resetData: {
    name: string
    resetLink: string
    expiresIn: string
}): string {
    const content = `
        <p>Hi ${resetData.name},</p>
        
        <p>We received a request to reset your password. Click the link below to create a new password:</p>
        
        <a href="${resetData.resetLink}" class="button">Reset Password</a>
        
        <p>This link expires in ${resetData.expiresIn}.</p>
        
        <p>If you didn't request a password reset, please ignore this email.</p>
    `

    return emailLayout(content, 'Password Reset Request')
}

// Test email (for verification)
export function testEmail(recipient: {
    name: string
}): string {
    const content = `
        <p>Hi ${recipient.name},</p>
        
        <p>This is a test email from Trident Store to verify your email address.</p>
        
        <p>If you received this email, your email notifications are working correctly!</p>
    `

    return emailLayout(content, 'Test Email')
}
