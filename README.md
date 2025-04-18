# Postie

A simple and flexible email sending library for Node.js with support for templates, retries, and more.

## Author

👤 **Anish Shekh**
- GitHub: [@anishhs-gh](https://github.com/anishhs-gh)
- LinkedIn: [@anishsh](https://linkedin.com/in/anishsh)
- Email: [mail@anishhs.com](mailto:mail@anishhs.com) (for feedback and support)

## Features

- Simple and intuitive API
- Support for multiple template engines (Handlebars, EJS, etc.)
- Automatic retry on failure
- Development mode for testing
- Named email addresses (e.g., "John Doe <john@example.com>")
- Support for JSON files for recipients and HTML content
- Flexible configuration options
- CLI tool for easy email sending
- Middleware support for custom email processing
- Project-specific configuration via `.postierc` file

## Installation

```bash
# Install globally for CLI usage
npm install -g @anishhs/postie

# Or install as a dependency in your project
npm install @anishhs/postie
```

## Configuration

Postie supports multiple configuration methods:

1. Global configuration in `~/.postie/config.json`
2. Project-specific configuration in `.postierc`
3. Runtime configuration via API

### Global Configuration

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

### Project Configuration (.postierc)

You can create a `.postierc` file in your project root to specify default options for that project. This is useful when you have project-specific email settings.

Example `.postierc` file:
```json
{
  "from": "project@example.com",
  "fromName": "Project Name",
  "subject": "Default Subject",
  "to": "team@example.com"
}
```

The CLI will automatically use these options when sending emails, but you can override them with command-line arguments.

### Runtime Configuration

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

## Middleware Support

Postie supports middleware functions that can modify email options before sending. This is useful for adding custom headers, logging, or modifying content.

```javascript
// Add a middleware function
postie.use((emailOptions, next) => {
  // Add a custom header
  emailOptions.headers = {
    ...emailOptions.headers,
    'X-Custom-Header': 'value'
  }
  
  // Log the email
  console.log('Sending email:', emailOptions)
  
  // Call next to continue processing
  next()
})

// Send an email (middleware will be called)
await postie.send({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  text: 'This is a test email'
})
```

You can add multiple middleware functions, and they will be called in the order they were added.

## Quick Start

1. Configure Postie with your SMTP settings:

```javascript
const Postie = require('postie')
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

// Send a basic email
await postie.send({
  from: 'sender@example.com',
  fromName: 'John Doe', // Optional sender name
  to: 'recipient@example.com',
  toName: 'Jane Smith', // Optional recipient name
  subject: 'Hello',
  text: 'This is a test email'
})

// Send to multiple recipients
await postie.send({
  from: 'sender@example.com',
  to: [
    'recipient1@example.com',
    { email: 'recipient2@example.com', name: 'Recipient 2' }
  ],
  subject: 'Hello',
  text: 'This is a test email'
})

// Send with HTML content
await postie.send({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  html: '<h1>Hello</h1><p>This is a test email</p>'
})

// Send with attachments
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

## Template Usage

```javascript
const Handlebars = require('handlebars')
postie.setTemplateEngine(Handlebars)

// Send a template email
await postie.sendTemplate({
  from: 'sender@example.com',
  to: 'recipient@example.com',
  subject: 'Hello',
  template: './templates/welcome.hbs',
  data: {
    name: 'John',
    company: 'Example Inc'
  }
})
```

## Configuration

```javascript
// Configure retry attempts and delay
postie.configure({
  retryAttempts: 3, // Number of retry attempts
  retryDelay: 1000, // Delay between retries in milliseconds
  devMode: false // Enable development mode
})
```

## CLI Usage

### Configure SMTP Settings

```bash
postie configure \
  --host smtp.gmail.com \
  --port 587 \
  --user your-email@gmail.com \
  --pass your-app-password \
  --secure false
```

### Send an Email

The `postie send` command automatically reads default options from `.postierc` if it exists in your project root. You can override any of these options using command-line arguments.

Example `.postierc` file:
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

```bash
# Basic email (uses defaults from .postierc)
postie send --text "This is a test email"

# Override defaults from .postierc
postie send \
  --from sender@example.com \
  --from-name "John Doe" \
  --to recipient@example.com \
  --to-name "Jane Smith" \
  --subject "Hello" \
  --text "This is a test email"

# Send to multiple recipients using JSON file
postie send \
  --from sender@example.com \
  --to recipients.json \
  --subject "Hello" \
  --text "This is a test email"

# Send with HTML content from file
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

### JSON File Formats

#### Recipients JSON
```json
// Format 1: Array of strings
["recipient1@example.com", "recipient2@example.com"]

// Format 2: Array of objects
[
  { "email": "recipient1@example.com", "name": "Recipient 1" },
  { "email": "recipient2@example.com", "name": "Recipient 2" }
]

// Format 3: Single string
"recipient@example.com"

// Format 4: Single object
{ "email": "recipient@example.com", "name": "Recipient" }
```

## Development Mode

Enable development mode to prevent actual email sending during testing:

```javascript
postie.configure({ devMode: true })
```

In development mode:
- Emails are not actually sent
- Email objects are logged to the console
- All operations succeed without network calls

## Error Handling

The library includes automatic retry on failure and detailed error messages:

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
}
```

## License

MIT 