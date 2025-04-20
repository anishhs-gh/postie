const Postie = require('../src');

// Create a Postie instance
const postie = new Postie();

// Configure SMTP transporter
postie.setTransporter({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: 'notifications@example.com',
    pass: 'xK9#mP2$vL5@nR8'
  }
});

// Middleware to add timestamp to subject
postie.use((email, next) => {
  const timestamp = new Date().toISOString();
  email.subject = `[${timestamp}] ${email.subject}`;
  next();
});

// Middleware to add custom headers
postie.use((email, next) => {
  email.headers = {
    ...email.headers,
    'X-Custom-Header': 'value',
    'X-Application': 'Postie'
  };
  next();
});

// Middleware to log email details
postie.use((email, next) => {
  console.log('Sending email:', {
    to: email.to,
    subject: email.subject,
    headers: email.headers
  });
  next();
});

// Send an email with middleware
async function sendEmail() {
  try {
    const result = await postie.send({
      from: 'sender@example.com',
      to: 'recipient@example.com',
      subject: 'Test Email with Middleware',
      text: 'This email demonstrates middleware functionality',
      html: '<p>This email demonstrates <b>middleware</b> functionality</p>'
    });

    console.log('Email sent successfully:', result);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
}

// Run the example
sendEmail(); 