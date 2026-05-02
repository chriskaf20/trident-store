/**
 * Email Service
 * Abstraction layer for sending emails
 * Can be configured to use SendGrid, Resend, AWS SES, or test mode
 */

import { ExternalServiceError } from '@/lib/errors'

export interface EmailRecipient {
    email: string
    name?: string
}

export interface EmailParams {
    to: EmailRecipient | EmailRecipient[]
    subject: string
    htmlBody: string
    textBody?: string
    replyTo?: string
    from?: EmailRecipient
}

/**
 * Send email using configured provider
 * Provider is determined by environment variables
 */
export async function sendEmail(params: EmailParams): Promise<{ success: boolean; messageId?: string }> {
    const provider = process.env.EMAIL_PROVIDER || 'test'

    try {
        switch (provider) {
            case 'sendgrid':
                return await sendViaSegrid(params)
            case 'resend':
                return await sendViaResend(params)
            case 'aws-ses':
                return await sendViaAwsSES(params)
            case 'test':
                return await sendViaTest(params)
            default:
                throw new Error(`Unknown email provider: ${provider}`)
        }
    } catch (error) {
        throw new ExternalServiceError(
            provider,
            error instanceof Error ? error.message : 'Unknown error'
        )
    }
}

/**
 * Send via SendGrid
 */
async function sendViaSegrid(params: EmailParams) {
    const apiKey = process.env.SENDGRID_API_KEY
    if (!apiKey) {
        throw new Error('SENDGRID_API_KEY not configured')
    }

    const to = Array.isArray(params.to) ? params.to : [params.to]

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: to.map(recipient => ({
                to: [{ email: recipient.email, name: recipient.name }],
                subject: params.subject
            })),
            from: {
                email: params.from?.email || process.env.SENDGRID_FROM_EMAIL || 'noreply@tridentstore.com',
                name: params.from?.name || 'Trident Store'
            },
            content: [
                {
                    type: 'text/html',
                    value: params.htmlBody
                },
                ...(params.textBody ? [{
                    type: 'text/plain',
                    value: params.textBody
                }] : [])
            ],
            reply_to: params.replyTo ? { email: params.replyTo } : undefined
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`SendGrid error: ${error.errors?.[0]?.message || 'Unknown'}`)
    }

    const messageId = response.headers.get('x-message-id')
    return { success: true, messageId: messageId || undefined }
}

/**
 * Send via Resend
 */
async function sendViaResend(params: EmailParams) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
        throw new Error('RESEND_API_KEY not configured')
    }

    const to = Array.isArray(params.to)
        ? params.to.map(r => r.email).join(',')
        : params.to.email

    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: params.from?.email || process.env.RESEND_FROM_EMAIL || 'noreply@tridentstore.com',
            to,
            subject: params.subject,
            html: params.htmlBody,
            text: params.textBody,
            reply_to: params.replyTo
        })
    })

    if (!response.ok) {
        const error = await response.json()
        throw new Error(`Resend error: ${error.message || 'Unknown'}`)
    }

    const data = await response.json()
    return { success: true, messageId: data.id }
}

/**
 * Send via AWS SES
 */
async function sendViaAwsSES(params: EmailParams) {
    const { SESClient, SendEmailCommand } = await import('@aws-sdk/client-ses')
    
    const to = Array.isArray(params.to)
        ? params.to.map(r => r.email)
        : [params.to.email]

    const client = new SESClient()
    
    const command = new SendEmailCommand({
        Source: params.from?.email || process.env.AWS_SES_FROM_EMAIL || 'noreply@tridentstore.com',
        Destination: { ToAddresses: to },
        Message: {
            Subject: { Data: params.subject },
            Body: {
                Html: { Data: params.htmlBody },
                ...(params.textBody && { Text: { Data: params.textBody } })
            }
        }
    })

    const response = await client.send(command)
    return { success: true, messageId: response.MessageId }
}

/**
 * Send in test mode (logs to console, no actual sending)
 * Useful for development
 */
async function sendViaTest(params: EmailParams) {
    const to = Array.isArray(params.to)
        ? params.to.map(r => r.email).join(', ')
        : params.to.email

    console.log('📧 [TEST EMAIL MODE] Email would be sent:')
    console.log(`To: ${to}`)
    console.log(`Subject: ${params.subject}`)
    console.log(`Body:\n${params.htmlBody}`)
    console.log('---')

    // In test mode, return a fake message ID
    return { success: true, messageId: `test-${Date.now()}` }
}

/**
 * Safely send email (catches and logs errors without throwing)
 * Use this when email is non-critical to main flow
 */
export async function sendEmailSafely(params: EmailParams): Promise<void> {
    try {
        await sendEmail(params)
    } catch (error) {
        console.error('Failed to send email:', error)
        // Don't throw - email failures shouldn't break the user flow
    }
}
