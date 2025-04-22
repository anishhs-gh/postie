import {
  Postie,
  SMTPConfig,
  PostieConfig,
  EmailOptions,
  AliasConfig,
  TemplateEngine,
  Middleware,
  SendResult
} from '@anishhs/postie';
import * as path from 'path';

// Create a Postie instance
const postie = new Postie();

// Configure SMTP with real data
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

// Configure global settings
const postieConfig: PostieConfig = {
  devMode: false,
  retryAttempts: 3,
  retryDelay: 1000
};
postie.configure(postieConfig);

// Add middleware
const logMiddleware: Middleware = (options: EmailOptions, next: () => void) => {
  console.log('Middleware: Preparing to send email to:', options.to);
  next();
};
postie.use(logMiddleware);

// Set up template engine
const templateEngine: TemplateEngine = {
  compile: (template: string) => template,
  render: (compiled: unknown, data: Record<string, any>) => {
    return (compiled as string).replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || match);
  }
};
postie.setTemplateEngine(templateEngine);

// Test SMTP connection
async function testConnection(): Promise<boolean> {
  try {
    const isConnected = await postie.testConnection();
    console.log('SMTP Connection:', isConnected ? '✅ Connected' : '❌ Failed');
    return isConnected;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}

// Send a basic email
async function sendBasicEmail(): Promise<SendResult> {
  const emailOptions: EmailOptions = {
    from: 'sender@example.com',
    fromName: 'Project Team',
    to: 'to@example.com',
    subject: 'Test Email from TypeScript',
    text: 'This is a test email sent from TypeScript'
  };

  try {
    const result = await postie.send(emailOptions);
    console.log('Basic email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send basic email:', error);
    throw error;
  }
}

// Send to multiple recipients with different formats
async function sendMultiRecipientEmail(): Promise<SendResult> {
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

  try {
    const result = await postie.send(multiRecipientEmail);
    console.log('Multi-recipient email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send multi-recipient email:', error);
    throw error;
  }
}

// Send email with attachments
async function sendEmailWithAttachments(): Promise<SendResult> {
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
        filename: 'anish_CV.pdf',
        path: path.join(__dirname, '/documents/anish_CV.pdf'),
        contentType: 'application/pdf'
      }
    ]
  };

  try {
    const result = await postie.send(emailWithAttachments);
    console.log('Email with attachments sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send email with attachments:', error);
    throw error;
  }
}

// Send template email
async function sendTemplateEmail(): Promise<SendResult> {
  try {
    const result = await postie.sendTemplate({
      from: 'sender@example.com',
      fromName: 'Project Team',
      to: 'to@example.com',
      subject: 'Template Email Test',
      template: 'Hello {{name}}, welcome to {{company}}!',
      data: {
        name: 'Anish',
        company: 'Postie'
      }
    });
    console.log('Template email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send template email:', error);
    throw error;
  }
}

// Define and trigger an alias
async function testAlias(): Promise<SendResult> {
  const welcomeAlias: AliasConfig = {
    type: 'notify',
    from: 'sender@example.com',
    fromName: 'Anish Shekh',
    to: 'to@example.com',
    subject: 'Test Alias Email',
    text: 'This is a test email from alias',
    html: '<p>This is a test email from alias</p>',
    template: 'Hello {{name}}, this is a test email!',
    data: {
      name: 'Anish'
    }
  };

  try {
    // Define the alias
    postie.define('notify-me', welcomeAlias);

    // Trigger the alias with overrides
    const result = await postie.trigger('notify-me', {
      to: 'to@example.com',
      data: {
        name: 'Anish'
      }
    });
    console.log('Alias email sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send alias email:', error);
    throw error;
  }
}

// Send a notification
async function sendNotification(): Promise<SendResult> {
  try {
    const result = await postie.notify({
      to: 'to@example.com',
      subject: 'System Notification',
      text: 'This is a system notification',
      html: '<p>This is a system notification</p>'
    });
    console.log('Notification sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send notification:', error);
    throw error;
  }
}

// Send an alert
async function sendAlert(): Promise<SendResult> {
  try {
    const result = await postie.alert({
      to: 'to@example.com',
      subject: 'System Alert',
      text: 'This is a system alert',
      html: '<p>This is a system alert</p>'
    });
    console.log('Alert sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send alert:', error);
    throw error;
  }
}

// Send a ping
async function sendPing(): Promise<SendResult> {
  try {
    const result = await postie.ping({
      to: 'to@example.com',
      subject: 'Ping Test',
      text: 'Ping!',
      html: '<p>Ping!</p>'
    });
    console.log('Ping sent:', result);
    return result;
  } catch (error) {
    console.error('Failed to send ping:', error);
    throw error;
  }
}

// Run all tests
async function runTests(): Promise<void> {
  console.log('Starting email tests...');
  
  await testConnection();
  await sendBasicEmail();
  await sendMultiRecipientEmail();
  await sendEmailWithAttachments();
  await sendTemplateEmail();
  await testAlias();
  await sendNotification();
  await sendAlert();
  await sendPing();
  
  console.log('All tests completed!');
}

// Execute the tests
runTests().catch(console.error); 