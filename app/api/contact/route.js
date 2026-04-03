/*
  POKEVAULT - CONTACT FORM API
  ---------------------------
  Backend API for processing the storefront contact form.
  - POST: Receives trainer inquiries (name, email, subject, message).
  - Sends email notifications to the admin via Resend.
*/

import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request) {
    try {
        const body = await request.json()
        const { name, email, subject, message } = body

        if (!name || !email || !message) {
            return Response.json({ error: 'Name, email, and message are required.' }, { status: 400 })
        }

        const ownerEmail = 'tanlanuzga@gmail.com'
        const defaultSender = 'onboarding@resend.dev' // Update when you verify a domain

        // 1. Email to the Owner (You)
        const notifyOwner = resend.emails.send({
            from: defaultSender,
            to: ownerEmail,
            subject: `Vault Inquiry: ${subject || 'New Message'}`,
            html: `
        <h3>New transmission from the PokéVault Contact Form</h3>
        <p><strong>Trainer Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Subject:</strong> ${subject || 'None'}</p>
        <hr />
        <p><strong>Message:</strong></p>
        <p>${message.replace(/\n/g, '<br>')}</p>
      `
        })

        // 2. Auto-reply to the Customer
        const notifyCustomer = resend.emails.send({
            from: defaultSender,
            to: email, // Sends to the email typed into the form
            subject: `Transmission Received: ${subject || 'PokéVault Inquiry'}`,
            html: `
        <h3>Hello ${name},</h3>
        <p>This is to confirmation that your transmission has been received by the PokéVault team.</p>
        <p>We are reviewing your inquiry and will respond to this email address shortly.</p>
        <hr />
        <p><strong>Your original message:</strong></p>
        <p><em>${message.replace(/\n/g, '<br>')}</em></p>
        <br/>
        <p>Stay sharp,<br/>The PokéVault Team</p>
      `
        })

        // Execute both emails at the same time
        await Promise.all([notifyOwner, notifyCustomer])

        return Response.json({ message: 'Message and confirmation sent successfully.' })
    } catch (error) {
        console.error('Contact form error:', error)
        return Response.json({ error: 'Failed to send messages.' }, { status: 500 })
    }
}