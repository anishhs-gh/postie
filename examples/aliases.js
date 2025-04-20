const Postie = require('../src');
const Handlebars = require('handlebars'); // npm install handlebars, ejs

// Create a Postie instance
const postie = new Postie();

// Configure template engine
postie.setTemplateEngine({
  compile: Handlebars.compile,
  render: (compiled, data) => compiled(data)
});

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

// Define a welcome email event
postie.define('user.welcome', {
  from: 'welcome@example.com',
  subject: 'Welcome to Our Platform!',
  template: `
    <h1>Welcome {{name}}!</h1>
    <p>Thank you for registering with our platform.</p>
    <p>Your account has been created successfully.</p>
  `,
  data: {
    company: 'Example Inc'
  }
});

// Define a password reset event
postie.define('user.passwordReset', {
  from: 'support@example.com',
  subject: 'Password Reset Request',
  template: `
    <h1>Password Reset</h1>
    <p>Hi {{name}},</p>
    <p>Click the link below to reset your password:</p>
    <a href="{{resetLink}}">Reset Password</a>
  `
});

// Define a system alert event
postie.define('system.alert', {
  type: 'alert',
  from: 'alerts@example.com',
  subject: 'System Alert',
  text: 'System is down'
});

// Simulate user registration
async function handleUserRegistration(user) {
  try {
    await postie.trigger('user.welcome', {
      to: user.email,
      data: {
        name: user.name
      }
    });
    console.log('Welcome email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

// Simulate password reset
async function handlePasswordReset(user) {
  try {
    await postie.trigger('user.passwordReset', {
      to: user.email,
      data: {
        name: user.name,
        resetLink: user.resetLink
      }
    });
    console.log('Password reset email sent to:', user.email);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }
}

// Simulate system alert
async function handleSystemAlert(alert) {
  try {
    await postie.trigger('system.alert', {
      to: 'admin@example.com',
      text: alert.message
    });
    console.log('System alert sent to admin');
  } catch (error) {
    console.error('Failed to send system alert:', error);
  }
}

// Run the examples
async function runExamples() {
  // Example 1: User registration
  await handleUserRegistration({
    name: 'Anish',
    email: 'user@example.com'
  });

  // Example 2: Password reset
  await handlePasswordReset({
    name: 'Anish',
    email: 'user@example.com',
    resetLink: 'https://example.com/reset-password?token=abc123'
  });

  // Example 3: System alert
  await handleSystemAlert({
    message: 'CPU usage is above 90%'
  });
}

// Run all examples
runExamples().catch(console.error);