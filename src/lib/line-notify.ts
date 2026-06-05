/**
 * LINE Messaging API Integration
 *
 * This utility provides functions to send notifications to LINE
 * when important events occur in the system.
 *
 * Setup Instructions:
 * 1. Create a LINE Official Account at https://manager.line.biz/
 * 2. Enable Messaging API in the LINE Official Account settings
 * 3. Get your Channel Access Token from the Messaging API tab
 * 4. Add the token to your .env.local file as LINE_CHANNEL_ACCESS_TOKEN
 * 5. Get the User ID or Group ID where you want to receive notifications
 *    - For personal notifications: Add the LINE Official Account as a friend
 *      and use LINE Developers Console to get your User ID
 *    - For group notifications: Add the LINE Official Account to a group
 *      and use the LINE Bot SDK to get the Group ID from webhook events
 * 6. Add the recipient ID to your .env.local file as LINE_ADMIN_USER_ID or LINE_ADMIN_GROUP_ID
 */

import { messagingApi } from '@line/bot-sdk'

const { MessagingApiClient } = messagingApi

// Initialize LINE Messaging API client
const lineClient = new MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
})

/**
 * Get the LINE recipient ID (User ID or Group ID) from environment variables
 */
function getRecipientId(): string {
  // Try to get admin user ID first, fallback to group ID
  const recipientId = process.env.LINE_ADMIN_USER_ID || process.env.LINE_ADMIN_GROUP_ID

  if (!recipientId) {
    console.error('LINE notification recipient ID not configured. Set LINE_ADMIN_USER_ID or LINE_ADMIN_GROUP_ID in environment variables.')
    throw new Error('LINE notification recipient ID not configured')
  }

  return recipientId
}

/**
 * Check if LINE notifications are enabled
 */
export function isLineNotificationEnabled(): boolean {
  return !!(
    process.env.LINE_CHANNEL_ACCESS_TOKEN &&
    (process.env.LINE_ADMIN_USER_ID || process.env.LINE_ADMIN_GROUP_ID)
  )
}

/**
 * Send a notification about a new seller registration pending approval
 */
export async function notifyNewSellerRegistration(data: {
  email: string
  fullName?: string
  registrationMethod: 'email' | 'google'
}): Promise<void> {
  // Skip if LINE notifications are not configured
  if (!isLineNotificationEnabled()) {
    console.log('LINE notifications disabled - skipping notification')
    return
  }

  try {
    const recipientId = getRecipientId()

    const message = `🎉 มีผู้สมัคร Seller ใหม่รอการอนุมัติ!

📧 อีเมล: ${data.email}
👤 ชื่อ: ${data.fullName || 'ยังไม่ระบุ'}
🔐 วิธีสมัคร: ${data.registrationMethod === 'email' ? 'Email/Password' : 'Google OAuth'}
📅 เวลา: ${new Date().toLocaleString('th-TH', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

กรุณาเข้าสู่ระบบเพื่ออนุมัติผู้สมัครท่านนี้`

    await lineClient.pushMessage({
      to: recipientId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    })

    console.log('LINE notification sent successfully for new seller registration:', data.email)
  } catch (error) {
    // Log error but don't throw - we don't want to fail the registration if notification fails
    console.error('Failed to send LINE notification:', error)
  }
}

/**
 * Send a notification about seller profile updates
 */
export async function notifySellerProfileUpdate(data: {
  email: string
  fullName: string
  phone: string
  updateType: 'profile_completed' | 'profile_updated'
}): Promise<void> {
  if (!isLineNotificationEnabled()) {
    console.log('LINE notifications disabled - skipping notification')
    return
  }

  try {
    const recipientId = getRecipientId()

    const action = data.updateType === 'profile_completed'
      ? '✅ Seller กรอกข้อมูลเสร็จสมบูรณ์แล้ว!'
      : '🔄 Seller อัพเดทข้อมูลโปรไฟล์'

    const message = `${action}

📧 อีเมล: ${data.email}
👤 ชื่อ: ${data.fullName}
📞 เบอร์โทร: ${data.phone}
📅 เวลา: ${new Date().toLocaleString('th-TH', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

${data.updateType === 'profile_completed' ? 'กรุณาเข้าสู่ระบบเพื่ออนุมัติผู้สมัครท่านนี้' : ''}`

    await lineClient.pushMessage({
      to: recipientId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    })

    console.log('LINE notification sent successfully for profile update:', data.email)
  } catch (error) {
    console.error('Failed to send LINE notification:', error)
  }
}

/**
 * Send a custom notification
 */
export async function sendCustomLineNotification(message: string): Promise<void> {
  if (!isLineNotificationEnabled()) {
    console.log('LINE notifications disabled - skipping notification')
    return
  }

  try {
    const recipientId = getRecipientId()

    await lineClient.pushMessage({
      to: recipientId,
      messages: [
        {
          type: 'text',
          text: message,
        },
      ],
    })

    console.log('Custom LINE notification sent successfully')
  } catch (error) {
    console.error('Failed to send custom LINE notification:', error)
  }
}
