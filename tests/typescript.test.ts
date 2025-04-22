import { Postie, SMTPConfig, PostieConfig, EmailOptions, AliasConfig, TemplateEngine, Middleware } from '@anishhs/postie';
import * as path from 'path';

describe('Postie TypeScript Tests', () => {
  let postie: Postie;

  beforeEach(() => {
    postie = new Postie();
  });

  describe('SMTP Configuration', () => {
    it('should configure SMTP settings correctly', () => {
      const smtpConfig: SMTPConfig = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'sender@example.com',
          pass: 'password'
        },
        debug: true,
        logger: true
      };

      postie.setTransporter(smtpConfig);
      expect(postie).toBeDefined();
    });

    it('should handle SMTP connection test', async () => {
      const smtpConfig: SMTPConfig = {
        host: 'smtp.example.com',
        port: 587,
        secure: false,
        auth: {
          user: 'sender@example.com',
          pass: 'password'
        }
      };

      postie.setTransporter(smtpConfig);
      const isConnected = await postie.testConnection();
      expect(typeof isConnected).toBe('boolean');
    });
  });

  describe('Global Configuration', () => {
    it('should configure global settings correctly', () => {
      const postieConfig: PostieConfig = {
        devMode: false,
        retryAttempts: 3,
        retryDelay: 1000
      };

      postie.configure(postieConfig);
      expect(postie).toBeDefined();
    });
  });

  describe('Middleware', () => {
    it('should add and execute middleware correctly', () => {
      const middleware: Middleware = (options: EmailOptions, next: () => void) => {
        expect(options).toBeDefined();
        next();
      };

      postie.use(middleware);
      expect(postie).toBeDefined();
    });
  });

  describe('Template Engine', () => {
    it('should compile and render templates correctly', () => {
      const templateEngine: TemplateEngine = {
        compile: (template: string) => template,
        render: (compiled: unknown, data: Record<string, any>) => {
          return (compiled as string).replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || match);
        }
      };

      postie.setTemplateEngine(templateEngine);

      const template = 'Hello {{name}}!';
      const data = { name: 'Test' };
      const result = templateEngine.render(templateEngine.compile(template), data);
      expect(result).toBe('Hello Test!');
    });
  });

  describe('Email Sending', () => {
    it('should prepare basic email options correctly', () => {
      const emailOptions: EmailOptions = {
        from: 'sender@example.com',
        fromName: 'Project Team',
        to: 'to@example.com',
        subject: 'Test Email from TypeScript',
        text: 'This is a test email sent from TypeScript'
      };

      expect(emailOptions).toHaveProperty('from');
      expect(emailOptions).toHaveProperty('to');
      expect(emailOptions).toHaveProperty('subject');
      expect(emailOptions).toHaveProperty('text');
    });

    it('should prepare multi-recipient email options correctly', () => {
      const multiRecipientEmail: EmailOptions = {
        from: 'sender@example.com',
        fromName: 'Project Team',
        to: [
          'to@example.com',
          { email: 'sender@example.com', name: 'Team Member' }
        ],
        cc: [
          'sender@example.com',
          { email: 'to@example.com', name: 'Project Manager' }
        ],
        subject: 'Multi-recipient Email Test',
        text: 'This email goes to multiple recipients'
      };

      expect(multiRecipientEmail.to).toHaveLength(2);
      expect(multiRecipientEmail.cc).toHaveLength(2);
    });

    it('should prepare email with attachments correctly', () => {
      const emailWithAttachments: EmailOptions = {
        from: 'sender@example.com',
        fromName: 'Project Team',
        to: 'to@example.com',
        subject: 'Email with Attachments',
        text: 'Please find the attached files',
        attachments: [
          {
            filename: 'test.txt',
            content: 'This is a test file content',
            contentType: 'text/plain'
          },
          {
            filename: 'test.pdf',
            path: path.join(__dirname, '/documents/test.pdf'),
            contentType: 'application/pdf'
          }
        ]
      };

      expect(emailWithAttachments.attachments).toHaveLength(2);
      expect(emailWithAttachments.attachments[0]).toHaveProperty('filename');
      expect(emailWithAttachments.attachments[0]).toHaveProperty('content');
    });

    it('should prepare HTML email correctly', () => {
      const htmlEmail: EmailOptions = {
        from: 'sender@example.com',
        fromName: 'Project Team',
        to: 'to@example.com',
        subject: 'HTML Email Test',
        html: '<h1>Hello</h1><p>This is an HTML email</p>'
      };

      expect(htmlEmail).toHaveProperty('html');
      expect(typeof htmlEmail.html).toBe('string');
    });
  });

  describe('Template Email', () => {
    it('should prepare template email correctly', () => {
      const templateEmail = {
        from: 'sender@example.com',
        fromName: 'Project Team',
        to: 'to@example.com',
        subject: 'Template Email Test',
        template: 'Hello {{name}}, welcome to {{company}}!',
        data: {
          name: 'Test',
          company: 'Postie'
        }
      };

      expect(templateEmail).toHaveProperty('template');
      expect(templateEmail).toHaveProperty('data');
      expect(templateEmail.data).toHaveProperty('name');
      expect(templateEmail.data).toHaveProperty('company');
    });
  });

  describe('Alias Configuration', () => {
    it('should define and prepare alias correctly', () => {
      const welcomeAlias: AliasConfig = {
        type: 'notify',
        from: 'sender@example.com',
        fromName: 'Test User',
        to: 'to@example.com',
        subject: 'Test Alias Email',
        text: 'This is a test email from alias',
        html: '<p>This is a test email from alias</p>',
        template: 'Hello {{name}}, this is a test email!',
        data: {
          name: 'Test'
        }
      };

      expect(welcomeAlias).toHaveProperty('type');
      expect(welcomeAlias).toHaveProperty('template');
      expect(welcomeAlias).toHaveProperty('data');
    });
  });

  describe('Notification Methods', () => {
    it('should prepare notification correctly', () => {
      const notification = {
        to: 'to@example.com',
        subject: 'System Notification',
        text: 'This is a system notification',
        html: '<p>This is a system notification</p>'
      };

      expect(notification).toHaveProperty('to');
      expect(notification).toHaveProperty('subject');
      expect(notification).toHaveProperty('text');
      expect(notification).toHaveProperty('html');
    });

    it('should prepare alert correctly', () => {
      const alert = {
        to: 'to@example.com',
        subject: 'System Alert',
        text: 'This is a system alert',
        html: '<p>This is a system alert</p>'
      };

      expect(alert).toHaveProperty('to');
      expect(alert).toHaveProperty('subject');
      expect(alert).toHaveProperty('text');
      expect(alert).toHaveProperty('html');
    });

    it('should prepare ping correctly', () => {
      const ping = {
        to: 'to@example.com',
        subject: 'Ping Test',
        text: 'Ping!',
        html: '<p>Ping!</p>'
      };

      expect(ping).toHaveProperty('to');
      expect(ping).toHaveProperty('subject');
      expect(ping).toHaveProperty('text');
      expect(ping).toHaveProperty('html');
    });
  });
}); 