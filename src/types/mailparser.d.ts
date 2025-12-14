declare module 'mailparser' {
  import { Readable } from 'stream';

  export interface Attachment {
    type: string;
    content?: Buffer;
    contentType: string;
    contentDisposition: string;
    filename?: string;
    headers: Map<string, string>;
    checksum: string;
    size: number;
    contentId?: string;
    cid?: string;
    related?: boolean;
  }

  export interface ParsedMail {
    headers: Map<string, string>;
    from?: {
      value: Array<{ address: string; name: string }>;
      html: string;
      text: string;
    };
    to?: {
      value: Array<{ address: string; name: string }>;
      html: string;
      text: string;
    };
    subject?: string;
    messageId?: string;
    date?: Date;
    html?: string;
    text?: string;
    textAsHtml?: string;
    attachments?: Attachment[];
  }

  export function simpleParser(source: Readable | Buffer | string): Promise<ParsedMail>;
}