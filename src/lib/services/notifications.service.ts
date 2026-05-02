/**
 * Notification Service
 * Orchestrates sending notifications at key events
 * Integrates with email service and templates
 */

import { sendEmailSafely } from './email.service'
import * as emailTemplates from './email-templates'

/**
 * Send order confirmation email to customer
 */
export async function notifyOrderConfirmed(orderData: {
    orderId: string
    customerEmail: string
    customerName: string
    items: Array<{ name: string; quantity: number; price: number }>
    total: number
    deliveryMethod: string
    address: string
}): Promise<void> {
    const htmlBody = emailTemplates.orderConfirmationEmail({
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        items: orderData.items,
        total: orderData.total,
        deliveryMethod: orderData.deliveryMethod,
        address: orderData.address
    })

    await sendEmailSafely({
        to: {
            email: orderData.customerEmail,
            name: orderData.customerName
        },
        subject: `Order Confirmation - #${orderData.orderId}`,
        htmlBody
    })
}

/**
 * Send order status update email to customer
 */
export async function notifyOrderStatusChanged(orderData: {
    orderId: string
    customerEmail: string
    customerName: string
    status: 'confirmed' | 'processing' | 'shipped' | 'delivered'
    trackingNumber?: string
    estimatedDelivery?: string
}): Promise<void> {
    const htmlBody = emailTemplates.orderStatusUpdateEmail({
        orderId: orderData.orderId,
        customerName: orderData.customerName,
        status: orderData.status,
        trackingNumber: orderData.trackingNumber,
        estimatedDelivery: orderData.estimatedDelivery
    })

    const statusMessages: Record<string, string> = {
        confirmed: 'confirmed',
        processing: 'being processed',
        shipped: 'shipped',
        delivered: 'delivered'
    }

    await sendEmailSafely({
        to: {
            email: orderData.customerEmail,
            name: orderData.customerName
        },
        subject: `Your Order #${orderData.orderId} - ${statusMessages[orderData.status]}`,
        htmlBody
    })
}

/**
 * Send vendor approval email
 */
export async function notifyVendorApproved(vendorData: {
    vendorEmail: string
    vendorName: string
    storeName: string
}): Promise<void> {
    const htmlBody = emailTemplates.vendorApprovalEmail({
        vendorName: vendorData.vendorName,
        storeName: vendorData.storeName
    })

    await sendEmailSafely({
        to: {
            email: vendorData.vendorEmail,
            name: vendorData.vendorName
        },
        subject: `Your Store "${vendorData.storeName}" is Now Active!`,
        htmlBody
    })
}

/**
 * Send vendor rejection email
 */
export async function notifyVendorRejected(vendorData: {
    vendorEmail: string
    vendorName: string
    storeName: string
    reason?: string
}): Promise<void> {
    const htmlBody = emailTemplates.vendorRejectionEmail({
        vendorName: vendorData.vendorName,
        storeName: vendorData.storeName,
        reason: vendorData.reason
    })

    await sendEmailSafely({
        to: {
            email: vendorData.vendorEmail,
            name: vendorData.vendorName
        },
        subject: `Application Status for "${vendorData.storeName}"`,
        htmlBody
    })
}

/**
 * Send low stock alert to vendor
 */
export async function notifyVendorLowStock(vendorData: {
    vendorEmail: string
    vendorName: string
    products: Array<{ name: string; available: number; reserved: number }>
}): Promise<void> {
    const htmlBody = emailTemplates.lowStockAlertEmail({
        vendorName: vendorData.vendorName,
        products: vendorData.products
    })

    await sendEmailSafely({
        to: {
            email: vendorData.vendorEmail,
            name: vendorData.vendorName
        },
        subject: 'Low Stock Alert - Action Required',
        htmlBody
    })
}

/**
 * Send newsletter welcome email
 */
export async function notifyNewsletterWelcome(subscriberData: {
    email: string
    name?: string
}): Promise<void> {
    const htmlBody = emailTemplates.newsletterWelcomeEmail({
        name: subscriberData.name
    })

    await sendEmailSafely({
        to: {
            email: subscriberData.email,
            name: subscriberData.name
        },
        subject: 'Welcome to Trident Store Newsletter',
        htmlBody
    })
}

/**
 * Send password reset email (when implemented)
 */
export async function notifyPasswordResetRequested(userData: {
    email: string
    name: string
    resetLink: string
    expiresIn: string
}): Promise<void> {
    const htmlBody = emailTemplates.passwordResetEmail({
        name: userData.name,
        resetLink: userData.resetLink,
        expiresIn: userData.expiresIn
    })

    await sendEmailSafely({
        to: {
            email: userData.email,
            name: userData.name
        },
        subject: 'Reset Your Password',
        htmlBody
    })
}

/**
 * Send test email (for verification)
 */
export async function sendTestEmail(email: string, name: string): Promise<void> {
    const htmlBody = emailTemplates.testEmail({ name })

    await sendEmailSafely({
        to: {
            email,
            name
        },
        subject: 'Test Email from Trident Store',
        htmlBody
    })
}

/**
 * Notify vendors of new orders (optional - can be disabled)
 */
export async function notifyVendorNewOrder(vendorData: {
    vendorEmail: string
    vendorName: string
    storeName: string
    orderId: string
    itemCount: number
    totalAmount: number
}): Promise<void> {
    const htmlBody = `
        <p>Hi ${vendorData.vendorName},</p>
        <p>You have a new order in your store <strong>${vendorData.storeName}</strong>!</p>
        <div class="order-details">
            <p><strong>Order ID:</strong> ${vendorData.orderId}</p>
            <p><strong>Items:</strong> ${vendorData.itemCount}</p>
            <p><strong>Total:</strong> ₹${vendorData.totalAmount.toFixed(2)}</p>
        </div>
        <a href="https://tridentstore.com/dashboard/orders/${vendorData.orderId}" style="display: inline-block; padding: 12px 24px; background-color: #1f2937; color: white; text-decoration: none; border-radius: 6px; margin: 20px 0;">View Order</a>
    `

    await sendEmailSafely({
        to: {
            email: vendorData.vendorEmail,
            name: vendorData.vendorName
        },
        subject: `New Order - #${vendorData.orderId}`,
        htmlBody
    })
}
