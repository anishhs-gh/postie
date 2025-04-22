# 📧 Postie API Documentation

## 👤 Author

👤 **Anish Shekh**
- 🔗 GitHub: [@anishhs-gh](https://github.com/anishhs-gh)
- 💼 LinkedIn: [@anishsh](https://linkedin.com/in/anishsh)
- 📧 Email: [mail@anishhs.com](mailto:mail@anishhs.com) (for feedback and support)

## 📦 Version
Current version: 1.0.4

## 📑 Table of Contents
1. [Installation](#-installation)
2. [TypeScript Support](#-typescript-support)
3. [Configuration](#-configuration)
4. [Basic Setup](#-basic-setup)
5. [Core Methods](#-core-methods)
6. [Email Sending](#-email-sending)
7. [Template Support](#-template-support)
8. [Middleware](#-middleware)
9. [Email Triggering By Aliases](#-email-triggering-by-aliases)
10. [CLI Usage](#-cli-usage)
11. [Configuration Files](#-configuration-files)
12. [Error Handling](#-error-handling)
13. [Development Mode](#-development-mode)

## 🚀 Installation

```bash
# Install as a dependency in your project
npm install @anishhs/postie

# Or install globally for CLI usage
npm install -g @anishhs/postie
```

## 📘 TypeScript Support

Postie comes with full TypeScript support out of the box. All features are properly typed and documented. Here's how to use Postie with TypeScript:

### Basic Setup

```typescript
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

// Create a Postie instance
const postie = new Postie();
```

### Core Types

```typescript
// Email address can be a string or an object with name
type EmailAddress = string | { email: string; name?: string };

// Email attachment interface
interface EmailAttachment {
  filename?: string;
  path?: string;
  content?: string | Buffer;
  contentType?: string;
  encoding?: string;
}

// Email sending result
interface SendResult {
  success: boolean;
  messageId?: string;
  devMode?: boolean;
  email?: EmailOptions;
}
```

### SMTP Configuration

```typescript
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
```

### Global Configuration

```typescript
const postieConfig: PostieConfig = {
  devMode: false,
  retryAttempts: 3,
  retryDelay: 1000
};

postie.configure(postieConfig);
```

### Sending Emails

```typescript
// Basic email
const emailOptions: EmailOptions = {
  from: 'sender@example.com',
  fromName: 'Project Team',
  to: 'to@example.com',
  subject: 'Test Email',
  text: 'This is a test email',
  html: '<p>This is a test email</p>'
};

// Multiple recipients
const multiRecipientEmail: EmailOptions = {
  from: 'sender@example.com',
  to: [
    'to@example.com',
    { email: 'sender@example.com', name: 'Team Member' }
  ],
  cc: [
    'sender@example.com',
    { email: 'to@example.com', name: 'Project Manager' }
  ],
  subject: 'Multi-recipient Email',
  text: 'This email goes to multiple recipients'
};

// With attachments
const emailWithAttachments: EmailOptions = {
  from: 'sender@example.com',
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
      filename: 'document.pdf',
      path: '/path/to/document.pdf',
      contentType: 'application/pdf'
    }
  ]
};

const result: SendResult = await postie.send(emailOptions);
```

### Template Engine

```typescript
const templateEngine: TemplateEngine = {
  compile: (template: string) => template,
  render: (compiled: unknown, data: Record<string, any>) => {
    return (compiled as string).replace(/\{\{(\w+)\}\}/g, (match: string, key: string) => data[key] || match);
  }
};

postie.setTemplateEngine(templateEngine);

// Send template email
const templateResult: SendResult = await postie.sendTemplate({
  from: 'sender@example.com',
  to: 'to@example.com',
  subject: 'Welcome',
  template: 'Hello {{name}}, welcome to {{company}}!',
  data: {
    name: 'John Doe',
    company: 'Example Inc'
  }
});
```

### Middleware

```typescript
const logMiddleware: Middleware = (options: EmailOptions, next: () => void) => {
  console.log('Middleware: Preparing to send email to:', options.to);
  next();
};

postie.use(logMiddleware);
```

### Aliases

```typescript
const welcomeAlias: AliasConfig = {
  type: 'notify',
  from: 'sender@example.com',
  fromName: 'Project Team',
  to: 'to@example.com',
  subject: 'Welcome',
  template: 'Hello {{name}}, welcome to {{company}}!',
  data: {
    company: 'Example Inc'
  }
};

postie.define('welcome', welcomeAlias);

// Trigger with overrides
const result: SendResult = await postie.trigger('welcome', {
  to: 'newuser@example.com',
  data: {
    name: 'John Doe'
  }
});
```

### Special Email Types

```typescript
// Notification
const notificationResult: SendResult = await postie.notify({
  to: 'to@example.com',
  subject: 'System Notification',
  text: 'This is a notification'
});

// Alert
const alertResult: SendResult = await postie.alert({
  to: 'to@example.com',
  subject: 'System Alert',
  text: 'This is an alert'
});

// Ping
const pingResult: SendResult = await postie.ping({
  to: 'to@example.com'
});
```

### Error Handling

```typescript
try {
  const result = await postie.send(emailOptions);
  console.log('Email sent successfully:', result);
} catch (error) {
  console.error('Failed to send email:', error);
  // Error details include:
  // - SMTP response
  // - Connection status
  // - Retry attempts
}
```

### Development Mode

```typescript
// Configure for development
postie.configure({
  devMode: true,
  retryAttempts: 1,
  retryDelay: 100
});

// Send test email
const devResult: SendResult = await postie.send({
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email'
});
// Email will be logged but not sent
```

## 📧 Basic Usage

## ⚙️ Configuration

Postie provides flexible configuration options that can be set globally or per instance.

### Global Configuration

```javascript
// Configure global settings
postie.configure({
  devMode: false,      // Enable development mode
  retryAttempts: 3,    // Number of retry attempts
  retryDelay: 1000     // Delay between retries in milliseconds
})
```

### SMTP Configuration

```javascript
// Configure SMTP settings
postie.setTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
})
```

### Template Engine Configuration

```javascript
// Configure template engine
postie.setTemplateEngine({
  render: (template, data) => {
    // Custom template rendering logic
    return renderedTemplate
  }
})
```

## ⚙️ Basic Setup

```javascript
const Postie = require('@anishhs/postie')
const postie = new Postie()

// Configure SMTP
postie.setTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // Use STARTTLS
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
})

// Optional: Configure retry settings
postie.configure({
  retryAttempts: 3,
  retryDelay: 1000,
  devMode: false
})
```

## 🔧 Core Methods

### `setTransporter(config)`
Configures the SMTP transporter.

```javascript
postie.setTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'your-app-password'
  }
})
```

### `configure(config)`
Sets global configuration options.

```javascript
postie.configure({
  devMode: false,      // Enable development mode
  retryAttempts: 3,    // Number of retry attempts
  retryDelay: 1000     // Delay between retries in milliseconds
})
```

### `testConnection()`
Tests the SMTP connection.

```javascript
const success = await postie.testConnection()
if (success) {
  console.log('SMTP connection successful')
}
```

## 📨 Email Sending

### 📝 Basic Email

```javascript
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe', // Optional
  to: 'recipient@example.com',
  toName: 'Jane Smith', // Optional
  subject: 'Hello',
  text: 'This is a test email'
})
```

### 👥 Multiple Recipients

```javascript
await postie.send({
  from: 'sender@example.com',
  to: [
    'recipient1@example.com',
    { email: 'recipient2@example.com', name: 'Recipient 2' }
  ],
  subject: 'Hello',
  text: 'This is a test email'
})
```

### 🌐 HTML Email

```javascript
await postie.send({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<h1>Hello</h1><p>This is an HTML email.</p>'
})
```

### 📎 With Attachments

```javascript
await postie.send({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'This is a test email',
  attachments: [
    {
      filename: 'document.pdf',
      path: '/path/to/document.pdf'
    }
  ]
})
```

### 🎯 Special Methods

#### `notify()`
Sends a notification email with a "[NOTIFICATION]" prefix.

```javascript
await postie.notify({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'System Update',
  text: 'The system has been updated'
})
```

#### `alert()`
Sends an alert email with an "[ALERT]" prefix.

```javascript
await postie.alert({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'High CPU Usage',
  text: 'CPU usage is above 90%'
})
```

#### `ping()`
Sends a simple ping email.

```javascript
await postie.ping({
  from: 'sender@example.com',
  to: 'recipient@example.com'
})
```

## 📋 Template Support

### Template Engine Setup

Postie supports any template engine that follows the standard template engine interface. Here are examples for different template engines:

#### Handlebars
```javascript
const Handlebars = require('handlebars')
const handlebarsEngine = {
  compile: Handlebars.compile,
  render: (compiled, data) => compiled(data)
}
postie.setTemplateEngine(handlebarsEngine)
```

#### EJS
```javascript
const ejs = require('ejs')
const ejsEngine = {
  compile: (template) => ejs.compile(template),
  render: (compiled, data) => compiled(data)
}
postie.setTemplateEngine(ejsEngine)
```

#### Custom Template Engine
You can create your own simple template engine:

```javascript
const customEngine = {
  render: (template, data) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
  }
}
postie.setTemplateEngine(customEngine)
```

### Send Template Email

You can send template emails in two ways:

1. Using a template string:
```javascript
await postie.sendTemplate({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Welcome',
  template: 'Hello {{name}}, Welcome to {{company}}!',
  data: {
    name: 'John Doe',
    company: 'Our Company'
  }
})
```

2. Using a template file:
```javascript
await postie.sendTemplate({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Welcome',
  template: path.join(__dirname, 'templates/welcome.hbs'),
  data: {
    name: 'John Doe',
    company: 'Our Company',
    role: 'Developer'
  }
})
```

### Template Engine Interface

To use a custom template engine, implement the following interface:

```javascript
const customEngine = {
  // Required: Function to render the template with data
  render: (template, data) => {
    // Return the rendered template string
    return renderedTemplate
  },
  
  // Optional: Function to compile the template
  compile: (template) => {
    // Return a compiled template function
    return compiledTemplate
  }
}
```

## 🔌 Middleware

Add middleware functions to modify email options before sending.

```javascript
// Add logging middleware
postie.use((emailOptions, next) => {
  console.log('Sending email:', emailOptions)
  next()
})

// Add custom header middleware
postie.use((emailOptions, next) => {
  emailOptions.headers = {
    ...emailOptions.headers,
    'X-Custom-Header': 'value'
  }
  next()
})
```

## 📧 Email Triggering By Aliases

Postie allows you to define reusable email configurations with aliases and trigger them with optional overrides. This is useful for setting up reusable email configurations.

### Define an Alias

```javascript
// Define a welcome email alias
postie.define('user-welcome', {
  from: 'welcome@example.com',
  subject: 'Welcome to Our Platform',
  template: 'Hello {{name}}, welcome to {{company}}!',
  data: {
    company: 'Example Inc'
  }
})

// Define a notification alias
postie.define('system-update', {
  type: 'notify',
  from: 'system@example.com',
  subject: 'System Update',
  text: 'A new system update is available'
})

// Define an alert alias
postie.define('high-usage', {
  type: 'alert',
  from: 'monitoring@example.com',
  subject: 'High Resource Usage',
  text: 'CPU usage is above 90%'
})
```

### Trigger an Alias

```javascript
// Trigger welcome email with overrides
await postie.trigger('user-welcome', {
  to: 'john@example.com',
  data: {
    name: 'John Doe'
  }
})

// Trigger system update
await postie.trigger('system-update', {
  to: 'admin@example.com'
})

// Trigger alert with custom message
await postie.trigger('high-usage', {
  to: 'admin@example.com',
  text: 'Memory usage is above 95%'
})
```

### Alias Configuration Options

You can use any of the following options in your alias configuration:

- Basic email options (`from`, `to`, `subject`, `text`, `html`)
- Template options (`template`, `data`)
- Special types (`type: 'notify'`, `type: 'alert'`, `type: 'ping'`)
- Attachments
- Headers
- Any other options supported by the email sending methods

When triggering an alias, you can override any of these options by passing them in the `overrides` object.

## 💻 CLI Usage

### Configure SMTP

```bash
postie configure \
  --host smtp.gmail.com \
  --port 587 \
  --user your-email@gmail.com \
  --pass your-app-password \
  --secure false
```

### Send Email

```bash
# Basic email
postie send \
  --from sender@example.com \
  --to recipient@example.com \
  --subject "Hello" \
  --text "This is a test email"

# Send with HTML
postie send \
  --from sender@example.com \
  --to recipient@example.com \
  --subject "Hello" \
  --html template.html

# Send with attachments
postie send \
  --from sender@example.com \
  --to recipient@example.com \
  --subject "Hello" \
  --text "This is a test email" \
  --attachments file1.pdf,file2.pdf
```

### Using CLI Aliases

Postie supports predefined email configurations through CLI aliases in your `.postierc` file. These aliases use the event-based triggering system under the hood.

```bash
# Send a predefined notification
postie send --alias notify-admin

# Send a system alert
postie send --alias system-alert
```

When you use a CLI alias:
1. Postie looks up the alias configuration in your `.postierc` file
2. It uses the event-based triggering system to send the email
3. The email is sent using the configured SMTP settings

You can override any alias configuration with command-line arguments:
```bash
# Override the recipient for a predefined notification
postie send --alias notify-admin --to "different-admin@example.com"

# Override the subject for a system alert
postie send --alias system-alert --subject "Custom Alert"
```

## 📁 Configuration Files

### Global Configuration (`~/.postie/config.json`)

```json
{
  "devMode": false,
  "retryAttempts": 3,
  "retryDelay": 1000,
  "transporter": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "your-email@gmail.com",
      "pass": "your-app-password"
    }
  }
}
```

### Project Configuration (.postierc)

You can create a `.postierc` file in your project root to specify default options for that project. This is useful when you have project-specific email settings. The settings in `.postierc` will override the global configuration from `~/.postie/config.json`.

Example `.postierc` file:
```json
{
  "emailDefaults": {
    // Basic email options
    "from": "project@example.com",
    "fromName": "Project Team",
    "subject": "Default Subject",
    "text": "Default email content",
    "html": "<h1>Default HTML content</h1>",

    // Recipients
    "to": "team@example.com",
    "toName": "Team Members",
    "cc": "manager@example.com",
    "ccName": "Project Manager",
    "bcc": "archive@example.com",
    "bccName": "Archive",

    // Multiple recipients (array format)
    "to": [
      "team@example.com",
      { "email": "manager@example.com", "name": "Project Manager" }
    ],
    "cc": [
      "stakeholder@example.com",
      { "email": "reviewer@example.com", "name": "Code Reviewer" }
    ],
    "bcc": [
      "archive@example.com",
      { "email": "audit@example.com", "name": "Audit Team" }
    ],

    // Attachments
    "attachments": [
      "docs/report.pdf",
      "docs/status.xlsx"
    ]
  },

  // SMTP settings (overrides global config)
  "smtp": {
    "host": "smtp.project.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "project@example.com",
      "pass": "project-password"
    },
    "debug": true,
    "logger": true
  },

  // Postie configuration (overrides global config)
  "configure": {
    "devMode": false,
    "retryAttempts": 3,
    "retryDelay": 1000
  },

  // CLI Aliases
  "aliases": {
    "notify-admin": {
      "to": "admin@example.com",
      "subject": "Alert!",
      "text": "Something happened"
    },
    "welcome-user": {
      "type": "notify",
      "to": "{{email}}",
      "subject": "Welcome {{name}}!",
      "template": "Hello {{name}}, welcome to our platform!",
      "data": {
        "company": "Example Inc"
      }
    },
    "system-alert": {
      "type": "alert",
      "to": "admin@example.com",
      "subject": "System Alert",
      "text": "{{message}}"
    }
  }
}
```

## 🚨 Error Handling

Postie provides comprehensive error handling for various scenarios:

### Connection Errors
```javascript
try {
  await postie.testConnection()
} catch (error) {
  console.error('SMTP connection failed:', error.message)
}
```

### Email Sending Errors
```javascript
try {
  await postie.send(emailOptions)
} catch (error) {
  console.error('Failed to send email:', error.message)
  // Error details include:
  // - SMTP response
  // - Connection status
  // - Retry attempts
}
```

### Configuration Errors
```javascript
try {
  postie.configure(invalidConfig)
} catch (error) {
  console.error('Invalid configuration:', error.message)
}
```

### Retry Mechanism
Postie automatically retries failed email sends based on configuration:
- Number of retry attempts
- Delay between retries
- Exponential backoff

## 🔧 Development Mode

Development mode provides additional features for testing and debugging:

### Enable Development Mode
```javascript
postie.configure({
  devMode: true
})
```

### Features in Development Mode
1. **Email Preview**: Emails are not actually sent
2. **Debug Logging**: Detailed logs of email processing
3. **Template Testing**: Easy testing of email templates
4. **Configuration Validation**: Strict validation of settings

### Using Development Mode
```javascript
// Configure for development
postie.configure({
  devMode: true,
  retryAttempts: 1,    // Fewer retries in development
  retryDelay: 100      // Shorter delay in development
})

// Send test email
await postie.send({
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email'
})
// Email will be logged but not sent
```