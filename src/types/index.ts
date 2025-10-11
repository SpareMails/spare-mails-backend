export interface ITemporaryEmail {
  id: string;
  email: string;
  domain: string;
  isActive: boolean;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IReceivedEmail {
  id: string;
  temporaryEmailId: string;
  fromEmail: string;
  fromName?: string;
  subject: string;
  textContent?: string;
  htmlContent?: string;
  attachments?: IEmailAttachment[];
  isRead: boolean;
  receivedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailAttachment {
  id: string;
  emailId: string;
  filename: string;
  contentType: string;
  size: number;
  filePath: string;
  createdAt: Date;
}

export interface IDomain {
  id: string;
  domain: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailStats {
  totalEmails: number;
  totalActiveAddresses: number;
  emailsReceivedToday: number;
  emailsReceivedThisWeek: number;
}

export interface CreateTemporaryEmailRequest {
  customName?: string;
  domain?: string;
  expiryMinutes?: number;
}

export interface CreateTemporaryEmailResponse {
  email: string;
  expiresAt: Date;
  id: string;
}

export interface GetEmailsResponse {
  emails: IReceivedEmail[];
  total: number;
  hasMore: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EmailQuery extends PaginationQuery {
  isRead?: boolean;
  search?: string;
}