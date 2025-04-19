# 📧 Postie API Documentation

## 👤 Author

👤 **Anish Shekh**
- 🔗 GitHub: [@anishhs-gh](https://github.com/anishhs-gh)
- 💼 LinkedIn: [@anishsh](https://linkedin.com/in/anishsh)
- 📧 Email: [mail@anishhs.com](mailto:mail@anishhs.com) (for feedback and support)

## 📑 Table of Contents
1. [Installation](#installation)
2. [Basic Setup](#basic-setup)
3. [Core Methods](#core-methods)
4. [Email Sending](#email-sending)
5. [Template Support](#template-support)
6. [Configuration](#configuration)
7. [Middleware](#middleware)
8. [CLI Usage](#cli-usage)
9. [Configuration Files](#configuration-files)
10. [Error Handling](#error-handling)

## 📦 Installation

```bash
# Install as a dependency in your project
npm install @anishhs/postie

# Or install globally for CLI usage
npm install -g @anishhs/postie
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

### Setup Template Engine

```javascript
const Handlebars = require('handlebars')
postie.setTemplateEngine(Handlebars)
```

### Send Template Email

```javascript
await postie.sendTemplate({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Welcome',
  template: './templates/welcome.hbs',
  data: {
    name: 'John',
    company: 'Example Inc'
  }
})
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

  // Template configuration
  "template": {
    "path": "templates/default.hbs",
    "data": {
      "projectName": "My Project",
      "teamName": "Development Team"
    }
  },

  // Middleware configuration
  "middleware": [
    {
      "name": "addCustomHeader",
      "enabled": true,
      "config": {
        "headerName": "X-Project-ID",
        "headerValue": "PROJ-123"
      }
    },
    {
      "name": "logEmail",
      "enabled": true
    }
  ]
}
```

The CLI will automatically use these options when sending emails, but you can override them with command-line arguments. The configuration precedence is:

1. Command line arguments (highest priority)
2. `.postierc` settings
3. Global configuration (`~/.postie/config.json`)

For example, to send an email using the defaults from `.postierc`:
```bash
postie send
```

To override specific options:
```bash
postie send --to "override@example.com" --subject "Custom Subject"
```

All SMTP settings in `.postierc` will take precedence over the global configuration. This allows you to have different SMTP settings for different projects.

## ⚠️ Error Handling

```javascript
try {
  await postie.send({
    from: 'sender@example.com',
    to: 'recipient@example.com',
    subject: 'Hello',
    text: 'This is a test email'
  })
} catch (error) {
  console.error('Failed to send email:', error.message)
  if (error.code === 'EAUTH') {
    console.error('Authentication failed. Please check your credentials.')
  }
}
```

### Common Error Codes

- `EAUTH`: Authentication failed
- `ECONNECTION`: Connection to SMTP server failed
- `ETIMEDOUT`: Connection timed out
- `ENOTFOUND`: SMTP host not found

## 🧪 Development Mode

Enable development mode to prevent actual email sending:

```javascript
postie.configure({ devMode: true })
```

In development mode:
- Emails are not actually sent
- Email objects are logged to the console
- All operations succeed without network calls 