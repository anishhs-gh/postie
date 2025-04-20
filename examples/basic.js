const Postie = require('../src')
const Handlebars = require('handlebars') // npm install handlebars, ejs
const path = require('path')

// Create a new Postie instance
const postie = new Postie()

// Example .postierc file content
const rcConfig = {
  "configure": {
    "devMode": false,
    "retryAttempts": 3,
    "retryDelay": 1000
  },
  "smtp": {
    "host": "smtp.gmail.com",
    "port": 587,
    "secure": false,
    "auth": {
      "user": "example.user@gmail.com",
      "pass": "your-app-password"
    }
  },
  "emailDefaults": {
    "from": "example.user@gmail.com",
    "fromName": "Anish",
    "cc": [
      { "email": "example.cc@example.com", "name": "CEO" }
    ],
    "bcc": "example.bcc@example.com"
  }
}

// Configure Postie with .postierc settings
if (rcConfig.configure) {
  postie.configure(rcConfig.configure)
}

// Set up SMTP transporter
if (rcConfig.smtp) {
  postie.setTransporter(rcConfig.smtp)
}

// Basic email with defaults from .postierc
async function sendBasicEmail() {
  try {
    const result = await postie.send({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'Hello from Postie!',
      text: 'This is a test email sent using Postie.',
    })
    console.log('Email sent:', result)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

// HTML email with attachment
async function sendHtmlEmail() {
  try {
    const result = await postie.send({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'HTML Email with Attachment',
      html: '<h1>Hello!</h1><p>This is an HTML email.</p>',
      attachments: [
        {
          filename: 'anish_CV.pdf',
          path: __dirname + '/documents/anish_CV.pdf'
        }
      ]
    })
    console.log('Email sent:', result)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

// Template email using Handlebars
async function sendTemplateEmail() {
  try {
    // Set up Handlebars as template engine
    const handlebarsEngine = {
      compile: Handlebars.compile,
      render: (compiled, data) => compiled(data)
    }
    postie.setTemplateEngine(handlebarsEngine)

    // Send email using template string
    const result1 = await postie.sendTemplate({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'Template Email',
      template: 'Hello {{name}}, Welcome to {{company}}!',
      data: {
        name: 'John Doe',
        company: 'Our Company'
      }
    })
    console.log('Template string email sent:', result1)

    // Send email using template file
    const result2 = await postie.sendTemplate({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'Welcome Email',
      template: path.join(__dirname, 'templates/welcome.hbs'),
      data: {
        name: 'John Doe',
        company: 'Our Company',
        role: 'Developer'
      }
    })
    console.log('Template file email sent:', result2)
  } catch (error) {
    console.error('Failed to send template email:', error)
  }
}

// Example with EJS template engine
async function sendEjsTemplateEmail() {
  try {
    let ejs;
    try {
      ejs = require('ejs');
    } catch (error) {
      console.log('EJS not available. Skipping EJS template example.');
      return;
    }

    postie.setTemplateEngine({
      compile: (template) => ejs.compile(template),
      render: (compiled, data) => compiled(data)
    })

    const result = await postie.sendTemplate({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'EJS Template Email',
      template: 'Welcome <%= name %> to <%= company %>!',
      data: {
        name: 'John Doe',
        company: 'Our Company'
      }
    })
    console.log('EJS template email sent:', result)
  } catch (error) {
    console.error('Failed to send EJS template email:', error)
  }
}

// Example with custom template engine
async function sendCustomTemplateEmail() {
  try {
    // Simple template engine that replaces {{key}} with values
    const customEngine = {
      render: (template, data) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
      }
    }
    postie.setTemplateEngine(customEngine)

    const result = await postie.sendTemplate({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'Custom Template Email',
      template: 'Hi {{name}}! Your role is {{role}}.',
      data: {
        name: 'John Doe',
        role: 'Admin'
      }
    })
    console.log('Custom template email sent:', result)
  } catch (error) {
    console.error('Failed to send custom template email:', error)
  }
}

// Example with middleware
async function sendEmailWithMiddleware() {
  try {
    // Add logging middleware
    postie.use((email, next) => {
      console.log('Sending email to:', email.to)
      next()
    })

    // Add custom header middleware
    postie.use((email, next) => {
      email.headers = {
        'X-Custom-Header': 'Custom Value'
      }
      next()
    })

    const result = await postie.send({
      ...rcConfig.emailDefaults,
      to: 'recipient@example.com',
      subject: 'Email with Middleware',
      text: 'This email was processed through middleware.'
    })
    console.log('Email with middleware sent:', result)
  } catch (error) {
    console.error('Failed to send email with middleware:', error)
  }
}

// Run examples
async function runExamples() {
  await sendBasicEmail()
  await sendHtmlEmail()
  await sendTemplateEmail()
  await sendEjsTemplateEmail()
  await sendCustomTemplateEmail()
  await sendEmailWithMiddleware()
}

// Run if called directly
if (require.main === module) {
  runExamples().catch(console.error)
} 