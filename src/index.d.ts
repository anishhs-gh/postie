/// <reference types="node" />

/**
 * Represents an email address, either as a plain string or an object with optional display name.
 */
export type EmailAddress = string | { email: string; name?: string };

/**
 * Represents an attachment for an email.
 */
export interface EmailAttachment {
  filename?: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
  encoding?: string;
}

/**
 * Defines options for sending an email.
 */
export interface EmailOptions {
  from?: EmailAddress;
  fromName?: string;
  to: EmailAddress | EmailAddress[];
  toName?: string;
  cc?: EmailAddress | EmailAddress[];
  ccName?: string;
  bcc?: EmailAddress | EmailAddress[];
  bccName?: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  headers?: Record<string, string>;
}

/**
 * Result of an attempted email send.
 */
export interface SendResult {
  success: boolean;
  messageId?: string;
  devMode?: boolean;
  email?: EmailOptions;
}

/**
 * SMTP transport configuration.
 */
export interface SMTPConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
  debug?: boolean;
  logger?: boolean;
}

/**
 * Global Postie settings.
 */
export interface PostieConfig {
  devMode?: boolean;
  retryAttempts?: number;
  retryDelay?: number;
}

/**
 * Interface for rendering email templates.
 */
export interface TemplateEngine {
  compile?: (template: string) => unknown;
  render: (compiled: unknown, data: Record<string, any>) => string;
}

/**
 * Logging interface for custom loggers.
 */
export interface Logger {
  info: (msg: string) => void;
  debug: (msg: string) => void;
  error: (msg: string) => void;
}

/**
 * Middleware signature for modifying email options before sending.
 */
export interface Middleware {
  (options: EmailOptions, next: () => void): void;
}

/**
 * Extended configuration used for defining an alias.
 */
export interface AliasConfig extends EmailOptions {
  type?: 'notify' | 'alert' | 'ping';
  template?: string;
  data?: Record<string, any>;
}

/**
 * Core Postie class for sending emails.
 */
export class Postie {
  constructor();

  setTransporter(config: SMTPConfig): this;

  configure(config: PostieConfig): this;

  setTemplateEngine(engine: TemplateEngine): this;

  testConnection(): Promise<boolean>;

  send(options: EmailOptions): Promise<SendResult>;

  notify(options: EmailOptions): Promise<SendResult>;

  alert(options: EmailOptions): Promise<SendResult>;

  ping(options: EmailOptions): Promise<SendResult>;

  sendTemplate(options: EmailOptions & { template: string; data: Record<string, any> }): Promise<SendResult>;

  use(middleware: Middleware): this;

  define(name: string, config: AliasConfig): this;

  trigger(
    name: string,
    overrides?: Partial<EmailOptions> & { data?: Record<string, any> }
  ): Promise<SendResult>;

  formatEmailAddress(email: string, name?: string): string;
}

export default Postie;
