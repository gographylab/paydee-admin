import type { EmailSendRequest, EmailSendResponse, EmailErrorResponse } from '@/types/email';

/**
 * Send approval notification email to seller using ThaiBulkSMS Email API
 *
 * @param sellerEmail - Seller's email address
 * @param firstName - Seller's first name
 * @param lastName - Seller's last name
 * @param sellerId - Last 5 characters of seller's user_id
 * @returns Promise<boolean> - true if email sent successfully, false otherwise
 */
export async function notifySellerApproval(
  sellerEmail: string,
  firstName: string,
  lastName: string,
  sellerId: string
): Promise<boolean> {
  try {
    // Get environment variables
    const apiKey = process.env.EMAIL_API_KEY;
    const apiSecret = process.env.EMAIL_API_SECRET;
    // Hardcoded template ID
    const templateId = '25111109-3640-8d1d-aede-aa62a09e23f2';
    const senderEmail = process.env.EMAIL_SENDER_ADDRESS;
    const senderName = process.env.EMAIL_SENDER_NAME;

    // Validate environment variables
    if (!apiKey || !apiSecret || !templateId || !senderEmail || !senderName) {
      console.error('❌ Email notification failed: Missing environment variables', {
        hasApiKey: !!apiKey,
        hasApiSecret: !!apiSecret,
        hasTemplateId: !!templateId,
        hasSenderEmail: !!senderEmail,
        hasSenderName: !!senderName,
      });
      return false;
    }

    // Validate input parameters
    if (!sellerEmail || !firstName || !lastName || !sellerId) {
      console.error('❌ Email notification failed: Missing required parameters', {
        hasSellerEmail: !!sellerEmail,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasSellerId: !!sellerId,
      });
      return false;
    }

    // Create Basic Auth header
    const basicAuth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');

    // Prepare email request payload
    const payload: EmailSendRequest = {
      template_uuid: templateId,
      payload: {
        FIRST_NAME: firstName,
        LAST_NAME: lastName,
        SELLER_ID: sellerId,
        EMAIL: sellerEmail,
      },
      mail_from: {
        email: senderEmail,
        name: senderName,
      },
      mail_to: {
        email: sellerEmail,
      },
      subject: `ยินดีด้วย! บัญชีของคุณได้รับการอนุมัติแล้ว`,
    };

    console.log('📧 Sending approval email to:', sellerEmail, {
      firstName,
      lastName,
      sellerId,
    });

    // Send email via ThaiBulkSMS API
    const response = await fetch(
      'https://tbs-email-api-gateway.omb.to/email/v1/send_template',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${basicAuth}`,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await response.json() as EmailSendResponse | EmailErrorResponse;

    if (!response.ok) {
      const errorData = data as EmailErrorResponse;
      console.error('❌ ThaiBulkSMS API error:', {
        status: response.status,
        statusCode: errorData.statusCode,
        message: errorData.message,
        path: errorData.path,
        timestamp: errorData.timestamp,
      });
      return false;
    }

    const successData = data as EmailSendResponse;
    console.log('✅ Email sent successfully:', {
      messageId: successData.message_id,
      creditUsed: successData.credit_used,
      creditRemain: successData.credit_remain,
      recipient: sellerEmail,
    });

    return true;
  } catch (error) {
    console.error('❌ Email notification failed with exception:', {
      error: error instanceof Error ? error.message : 'Unknown error',
      sellerEmail,
      firstName,
      lastName,
      sellerId,
    });
    return false;
  }
}

/**
 * Extract last 5 characters from user_id for SELLER_ID
 *
 * @param userId - Full user UUID
 * @returns Last 5 characters of the user_id
 */
export function extractSellerId(userId: string): string {
  return userId.slice(-5);
}

/**
 * Parse full name into first name and last name
 * If full name is a single word, use it as first name and empty last name
 *
 * @param fullName - Full name string
 * @returns Object with firstName and lastName
 */
export function parseFullName(fullName: string): { firstName: string; lastName: string } {
  const trimmedName = fullName.trim();
  const parts = trimmedName.split(/\s+/);

  if (parts.length === 0 || trimmedName === '') {
    return { firstName: '', lastName: '' };
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  // First part is first name, rest is last name
  const firstName = parts[0];
  const lastName = parts.slice(1).join(' ');

  return { firstName, lastName };
}
