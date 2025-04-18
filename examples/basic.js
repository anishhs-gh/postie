const postie = require('../src')

// Configure Postie
postie.configure({
  devMode: true, // Set to false in production
  retryAttempts: 3,
  retryDelay: 1000
})

// Set up SMTP transporter
postie.setTransporter({
  host: 'smtp.example.com', // Replace with your SMTP host
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com', // Replace with your SMTP username
    pass: 'your-password' // Replace with your SMTP password
  }
})

// Basic email
async function sendBasicEmail() {
  try {
    const result = await postie.send({
      from: 'sender@example.com', // Required
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
      from: 'sender@example.com', // Required
      to: 'recipient@example.com',
      subject: 'HTML Email with Attachment',
      html: '<h1>Hello!</h1><p>This is an HTML email.</p>',
      attachments: [
        {
          filename: 'document.pdf',
          path: './path/to/document.pdf'
        }
      ]
    })
    console.log('Email sent:', result)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

// Template email
async function sendTemplateEmail() {
  try {
    const result = await postie.sendTemplate({
      from: 'sender@example.com', // Required
      to: 'recipient@example.com',
      subject: 'Template Email',
      template: './templates/welcome.hbs',
      data: {
        name: 'John Doe',
        message: 'Welcome to our service!'
      }
    })
    console.log('Email sent:', result)
  } catch (error) {
    console.error('Failed to send email:', error)
  }
}

// Run examples
sendBasicEmail()
sendHtmlEmail()
sendTemplateEmail() 