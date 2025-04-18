# Postie

A simple and powerful email sending library for Node.js with support for templates, attachments, and a CLI interface.

## Author

👤 **Anish Shekh**
- GitHub: [@anishhs-gh](https://github.com/anishhs-gh)
- LinkedIn: [@anishsh](https://linkedin.com/in/anishsh)
- Email: [mail@anishhs.com](mailto:mail@anishhs.com) (for feedback and support)

## Features

- Simple and intuitive API
- Support for plain text and HTML emails
- Flexible template engine support (Handlebars, EJS, etc.)
- Named email addresses
- File attachments
- Multiple recipients (to, cc, bcc)
- Retry mechanism for failed sends
- Development mode for testing
- CLI interface
- Middleware support
- Configurable logging

## Installation

```bash
# Install globally for CLI usage
npm install -g @anishhs/postie

# Or install as a dependency in your project
npm install @anishhs/postie
```

## Configuration

Postie stores its configuration in `~/.postie/config.json`. This file contains your SMTP settings and other configuration options. The file is automatically created when you run the configure command.

Example configuration file:
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
      "user": "your.email@gmail.com",
      "pass": "your-app-password"
    },
    "debug": true,
    "logger": true
  }
}
```

You can configure Postie using the CLI:

```bash
postie configure \
  --host smtp.gmail.com \
  --port 587 \
  --user your.email@gmail.com \
  --pass your-app-password \
  --secure false \
  --dev-mode false \
  --retry-attempts 3 \
  --retry-delay 1000
```

## Quick Start

1. Configure Postie with your SMTP settings:

```javascript
const postie = require('postie')

// Configure Postie
postie.configure({
  devMode: false, // Set to true for testing
  retryAttempts: 3,
  retryDelay: 1000
})

// Set up SMTP transporter
postie.setTransporter({
  host: 'smtp.example.com',
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password'
  }
})

// Send a simple email
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe', // Optional sender name
  to: 'recipient@example.com',
  toName: 'Jane Smith', // Optional recipient name
  subject: 'Hello!',
  text: 'This is a test email.'
})
```

## Basic Usage

### Sending Emails

```javascript
// Send a plain text email with named addresses
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe',
  to: 'recipient@example.com',
  toName: 'Jane Smith',
  subject: 'Hello!',
  text: 'This is a test email.'
})

// Send to multiple recipients with names
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe',
  to: [
    { email: 'recipient1@example.com', name: 'Jane Smith' },
    { email: 'recipient2@example.com', name: 'Bob Johnson' }
  ],
  cc: { email: 'cc@example.com', name: 'CC Person' },
  bcc: [
    { email: 'bcc1@example.com', name: 'BCC Person 1' },
    { email: 'bcc2@example.com', name: 'BCC Person 2' }
  ],
  subject: 'Multiple Recipients',
  text: 'This email has multiple recipients.'
})
```

### Using Templates

Postie supports any template engine that provides a `compile` method. Here are examples using different engines:

```javascript
// Using Handlebars
const Handlebars = require('handlebars')
postie.setTemplateEngine(Handlebars)

// Using EJS
const ejs = require('ejs')
postie.setTemplateEngine({
  compile: (template) => (data) => ejs.render(template, data)
})

// Using custom template engine
postie.setTemplateEngine({
  compile: (template) => (data) => {
    // Your custom template compilation logic
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || '')
  }
})

// Send a template email
await postie.sendTemplate({
  from: 'sender@example.com',
  fromName: 'John Doe',
  to: 'recipient@example.com',
  toName: 'Jane Smith',
  subject: 'Welcome Email',
  template: './templates/welcome.hbs',
  data: {
    name: 'John Doe',
    message: 'Welcome to our service!'
  }
})
```

### Middleware

Add middleware to modify or validate emails before sending:

```javascript
postie.use(async (email) => {
  // Add timestamp to subject
  email.subject = `[${new Date().toISOString()}] ${email.subject}`;
  
  // Validate email
  if (!email.from) {
    throw new Error('Sender is required')
  }
  if (!email.to) {
    throw new Error('Recipient is required')
  }
})
```

### Development Mode

Enable development mode to prevent actual email sending:

```javascript
postie.configure({
  devMode: true
})

// Emails will be logged but not sent
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe',
  to: 'recipient@example.com',
  toName: 'Jane Smith',
  subject: 'Test Email',
  text: 'This email will not be sent in dev mode.'
})
```

## CLI Usage

```bash
# Install globally
npm install -g postie

# Configure SMTP settings
postie configure --host smtp.example.com --port 587 --user your-email@example.com --pass your-password

# Send an email with names
postie send \
  --from sender@example.com \
  --from-name "John Doe" \
  --to recipient@example.com \
  --to-name "Jane Smith" \
  --subject "Hello" \
  --text "This is a test email"

# Send HTML email
postie send \
  --from sender@example.com \
  --from-name "John Doe" \
  --to recipient@example.com \
  --to-name "Jane Smith" \
  --subject "HTML Email" \
  --html "<h1>Hello</h1>"

# Send with attachments
postie send \
  --from sender@example.com \
  --from-name "John Doe" \
  --to recipient@example.com \
  --to-name "Jane Smith" \
  --subject "With Attachment" \
  --text "See attached" \
  --attachments file1.pdf,file2.jpg
```

## Development

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run linter
npm run lint

# Run example
npm run example
```

## License

MIT 