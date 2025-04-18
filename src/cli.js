#!/usr/bin/env node

const { program } = require('commander')
const Postie = require('./index')
const fs = require('fs')
const path = require('path')

// Create a new Postie instance
const postie = new Postie()

// Configuration file path
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.postie', 'config.json')
const RC_FILE = '.postierc';

// Ensure config directory exists
if (!fs.existsSync(path.dirname(CONFIG_FILE))) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true })
}

// Load configuration if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'))
      // Configure Postie
      postie.configure({
        devMode: config.devMode,
        retryAttempts: config.retryAttempts,
        retryDelay: config.retryDelay
      })
      // Set up SMTP transporter
      postie.setTransporter(config.transporter)
      return true;
    }
  } catch (error) {
    console.error('Error loading configuration:', error.message)
  }
  return false;
}

// Load options from .postierc file
function loadRCOptions() {
  try {
    if (fs.existsSync(RC_FILE)) {
      return JSON.parse(fs.readFileSync(RC_FILE, 'utf8'))
    }
  } catch (error) {
    console.error('Error loading .postierc file:', error.message)
  }
  return null;
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2))
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error.message)
    return false;
  }
}

program
  .name('postie')
  .description('Postie email sending tool')
  .version('1.0.0')

// Configure command
program
  .command('configure')
  .description('Configure SMTP settings')
  .requiredOption('--host <host>', 'SMTP host')
  .requiredOption('--port <port>', 'SMTP port')
  .requiredOption('--user <user>', 'SMTP username')
  .requiredOption('--pass <pass>', 'SMTP password')
  .option('--secure', 'Use secure connection', false)
  .option('--dev-mode', 'Enable development mode')
  .option('--retry-attempts <attempts>', 'Number of retry attempts', '3')
  .option('--retry-delay <delay>', 'Delay between retries in ms', '1000')
  .action(async (options) => {
    try {
      // Log the parsed options
      console.log('Parsed options:')
      console.log('Email:', options.user)
      console.log('Password length:', options.pass.length)
      console.log('Host:', options.host)
      console.log('Port:', options.port)
      console.log('Secure:', options.secure)

      // Configure Postie
      postie.configure({
        devMode: options.devMode,
        retryAttempts: parseInt(options.retryAttempts),
        retryDelay: parseInt(options.retryDelay)
      })

      // Set up SMTP transporter with debug logging
      const transporterConfig = {
        host: options.host,
        port: parseInt(options.port),
        secure: options.secure,
        auth: {
          user: options.user,
          pass: options.pass.trim()
        },
        debug: true,
        logger: true
      }

      // Set transporter and test connection
      postie.setTransporter(transporterConfig)
      
      // Test the connection
      const connectionSuccess = await postie.testConnection()
      if (!connectionSuccess) {
        console.error('Failed to configure SMTP. Please check your settings and try again.')
        process.exit(1)
      }

      // Save configuration
      if (saveConfig({
        devMode: options.devMode,
        retryAttempts: parseInt(options.retryAttempts),
        retryDelay: parseInt(options.retryDelay),
        transporter: transporterConfig
      })) {
        console.log('SMTP configuration saved successfully!')
      }
    } catch (error) {
      console.error('Error configuring SMTP:', error.message)
      process.exit(1)
    }
  })

// Send command
program
  .command('send')
  .description('Send an email')
  .option('--from <email>', 'Sender email address')
  .option('--from-name <name>', 'Sender name')
  .option('--to <email|file>', 'Recipient email address or path to JSON file (.json) containing recipients. JSON format: string or array of {email, name} objects')
  .option('--to-name <name>', 'Recipient name (only used when --to is an email address)')
  .option('--cc <email>', 'CC email address')
  .option('--cc-name <name>', 'CC recipient name')
  .option('--bcc <email>', 'BCC email address')
  .option('--bcc-name <name>', 'BCC recipient name')
  .option('--subject <subject>', 'Email subject')
  .option('--text <text>', 'Plain text content')
  .option('--html <html|file>', 'HTML content or path to HTML file (.html)')
  .option('--attachments <files>', 'Comma-separated list of attachment files')
  .action(async (options) => {
    try {
      // Try to load configuration
      if (!loadConfig()) {
        throw new Error('SMTP not configured. Please run "postie configure" first.')
      }

      // Check if SMTP is configured
      if (!postie.transporter) {
        throw new Error('SMTP not configured. Please run "postie configure" first.')
      }

      // Load options from .postierc if no options provided
      const rcOptions = loadRCOptions()
      if (rcOptions && Object.keys(options).length === 0) {
        options = rcOptions;
      }

      // Validate required options
      if (!options.from) {
        throw new Error('Sender email is required. Use --from or provide it in .postierc')
      }
      if (!options.to) {
        throw new Error('Recipient is required. Use --to or provide it in .postierc')
      }
      if (!options.subject) {
        throw new Error('Subject is required. Use --subject or provide it in .postierc')
      }

      // Prepare email options
      const emailOptions = {
        from: options.fromName ? { email: options.from, name: options.fromName } : options.from,
        subject: options.subject
      }

      // Handle recipients (to)
      if (options.to.endsWith('.json')) {
        // Read recipients from JSON file
        const recipientsPath = path.resolve(process.cwd(), options.to)
        if (!fs.existsSync(recipientsPath)) {
          throw new Error(`Recipients file not found: ${recipientsPath}`)
        }
        const recipients = JSON.parse(fs.readFileSync(recipientsPath, 'utf8'))
        if (Array.isArray(recipients)) {
          emailOptions.to = recipients.map(recipient => {
            if (typeof recipient === 'string') {
              return recipient
            }
            return { email: recipient.email, name: recipient.name }
          })
        } else if (typeof recipients === 'string') {
          emailOptions.to = recipients
        } else {
          emailOptions.to = { email: recipients.email, name: recipients.name }
        }
      } else {
        // Single recipient with optional name
        emailOptions.to = options.toName ? { email: options.to, name: options.toName } : options.to;
      }

      // Add CC if provided
      if (options.cc) {
        emailOptions.cc = options.ccName ? { email: options.cc, name: options.ccName } : options.cc;
      }

      // Add BCC if provided
      if (options.bcc) {
        emailOptions.bcc = options.bccName ? { email: options.bcc, name: options.bccName } : options.bcc;
      }

      // Add content
      if (options.text) {
        emailOptions.text = options.text;
      }
      if (options.html) {
        if (options.html.endsWith('.html')) {
          // Read HTML from file
          const htmlPath = path.resolve(process.cwd(), options.html)
          if (!fs.existsSync(htmlPath)) {
            throw new Error(`HTML file not found: ${htmlPath}`)
          }
          emailOptions.html = fs.readFileSync(htmlPath, 'utf8')
        } else {
          emailOptions.html = options.html;
        }
      }

      // Add attachments if provided
      if (options.attachments) {
        emailOptions.attachments = options.attachments.split(',').map(file => ({
          filename: path.basename(file),
          path: path.resolve(process.cwd(), file)
        }))
      }

      // Send email
      await postie.send(emailOptions)
      console.log('Email sent successfully!')
    } catch (error) {
      console.error('Error sending email:', error.message)
      process.exit(1)
    }
  })

program.parse(process.argv) 