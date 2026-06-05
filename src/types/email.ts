// ThaiBulkSMS Email API Types

export interface EmailMergeTag {
  FIRST_NAME?: string;
  LAST_NAME?: string;
  SELLER_ID?: string;
  EMAIL?: string;
  [key: string]: string | undefined;
}

export interface EmailSendRequest {
  template_uuid: string;
  payload: EmailMergeTag;
  mail_from: {
    email: string;
    name: string;
  };
  mail_to: {
    email: string;
  };
  subject: string;
}

export interface EmailSendResponse {
  message_id: string;
  credit_type: string;
  credit_used: number;
  credit_remain: number;
}

export interface EmailErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  message: string;
}
