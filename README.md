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

### Project Configuration (`.postierc`)

```json
{
  "from": "noreply@example.com",
  "fromName": "Example Team",
  "subject": "Default Subject",
  "to": "team@example.com",
  "toName": "Team Members",
  "attachments": ["report.pdf"]
}
```

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