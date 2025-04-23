#!/usr/bin/env node

const { program } = require('commander');
const Postie = require('./index');
const fs = require('fs');
const path = require('path');

// Create a new Postie instance
const postie = new Postie();

// Configuration file path
const CONFIG_FILE = path.join(process.env.HOME || process.env.USERPROFILE, '.postie', 'config.json');
const RC_FILE = '.postierc';

// Ensure config directory exists
if (!fs.existsSync(path.dirname(CONFIG_FILE))) {
  fs.mkdirSync(path.dirname(CONFIG_FILE), { recursive: true });
}

// Load configuration if exists
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      // Configure Postie
      postie.configure({
        devMode: config.devMode,
        retryAttempts: config.retryAttempts,
        retryDelay: config.retryDelay
      });
      // Set up SMTP transporter
      postie.setTransporter(config.transporter);
      return true;
    }
  } catch (error) {
    console.error('Error loading configuration:', error.message);
  }
  return false;
}

// Load options from .postierc file
function loadRCOptions() {
  try {
    if (fs.existsSync(RC_FILE)) {
      const rcConfig = JSON.parse(fs.readFileSync(RC_FILE, 'utf8'));

      // Configure Postie with RC settings if present
      if (rcConfig.configure) {
        postie.configure({
          devMode: rcConfig.configure.devMode,
          retryAttempts: rcConfig.configure.retryAttempts,
          retryDelay: rcConfig.configure.retryDelay
        });
      }

      // Set up SMTP transporter if present
      if (rcConfig.smtp) {
        postie.setTransporter(rcConfig.smtp);
      }

      return rcConfig;
    }
  } catch (error) {
    console.error('Error loading .postierc file:', error.message);
  }
  return null;
}

// Merge command line options with .postierc defaults
function mergeOptions(cmdOptions, rcConfig) {
  if (!rcConfig) return cmdOptions;

  // Start with .postierc defaults
  const merged = { ...rcConfig.emailDefaults };

  // Override with command line options
  Object.keys(cmdOptions).forEach(key => {
    if (cmdOptions[key] !== undefined) {
      merged[key] = cmdOptions[key];
    }
  });

  // Handle name fields after all options are merged
  const emailFields = ['from', 'to', 'cc', 'bcc'];
  emailFields.forEach(field => {
    const nameField = `${field}Name`;
    if (merged[nameField]) {
      // If the field is already an array, add the new recipient
      if (Array.isArray(merged[field])) {
        merged[field].push({ email: merged[field], name: merged[nameField] });
      } else {
        // Otherwise create a new object
        merged[field] = { email: merged[field], name: merged[nameField] };
      }
      delete merged[nameField];
    }
  });

  return merged;
}

// Handle JSON file for recipients
function handleRecipientsFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Recipients file not found: ${filePath}`);
  }
  const recipients = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  return Array.isArray(recipients)
    ? recipients.map(recipient => typeof recipient === 'string' ? recipient : { email: recipient.email, name: recipient.name })
    : typeof recipients === 'string' ? recipients : { email: recipients.email, name: recipients.name };
}

// Handle HTML from file
function handleHtmlFromFile(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`HTML file not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
}

// Handle attachments
function handleAttachments(attachments) {
  return Array.isArray(attachments)
    ? attachments.map(file => ({
      filename: path.basename(file),
      path: path.resolve(process.cwd(), file)
    }))
    : attachments.split(',').map(file => ({
      filename: path.basename(file),
      path: path.resolve(process.cwd(), file)
    }));
}

// Validate required email options
function validateEmailOptions(options) {
  const errors = [];

  if (!options.from) {
    errors.push('Sender email is required. Use --from or provide it in .postierc');
  }
  if (!options.to) {
    errors.push('Recipient is required. Use --to or provide it in .postierc');
  }
  if (!options.subject) {
    errors.push('Subject is required. Use --subject or provide it in .postierc');
  }
  if (!options.text && !options.html) {
    errors.push('Email content is required. Use --text or --html or provide it in .postierc');
  }

  if (errors.length > 0) {
    throw new Error(`Missing required options:\n${errors.join('\n')}`);
  }
}

// Save configuration
function saveConfig(config) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving configuration:', error.message);
    return false;
  }
}

program
  .name('postie')
  .description('Postie email sending tool')
  .version('1.0.5');

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
      console.log('Parsed options:');
      console.log('Email:', options.user);
      console.log('Password length:', options.pass.length);
      console.log('Host:', options.host);
      console.log('Port:', options.port);
      console.log('Secure:', options.secure);

      // Configure Postie
      postie.configure({
        devMode: options.devMode,
        retryAttempts: parseInt(options.retryAttempts),
        retryDelay: parseInt(options.retryDelay)
      });

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
      };

      // Set transporter and test connection
      postie.setTransporter(transporterConfig);

      // Test the connection
      const connectionSuccess = await postie.testConnection();
      if (!connectionSuccess) {
        console.error('Failed to configure SMTP. Please check your settings and try again.');
        process.exit(1);
      }

      // Save configuration
      if (saveConfig({
        devMode: options.devMode,
        retryAttempts: parseInt(options.retryAttempts),
        retryDelay: parseInt(options.retryDelay),
        transporter: transporterConfig
      })) {
        console.log('SMTP configuration saved successfully!');
      }
    } catch (error) {
      console.error('Error configuring SMTP:', error.message);
      process.exit(1);
    }
  });

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
  .option('--alias <alias>', 'Use a predefined alias from .postierc')
  .action(async (options) => {
    try {
      // Step 1: Load global config
      if (!loadConfig()) {
        throw new Error('SMTP not configured. Please either:\n' +
          '1. Run "postie configure" to set up global SMTP settings, or\n' +
          '2. Create a .postierc file in your project root with SMTP configuration');
      }

      // Step 2: Load and merge .postierc with command line options
      const rcConfig = loadRCOptions();

      // If using an alias, handle it through the event system
      if (options.alias) {
        if (!rcConfig || !rcConfig.aliases || !rcConfig.aliases[options.alias]) {
          throw new Error(`Alias "${options.alias}" not found in .postierc`);
        }

        // Define the event for this alias
        const aliasConfig = rcConfig.aliases[options.alias];
        postie.define(options.alias, aliasConfig);

        // Remove alias-specific options before merging
        // const { alias, ...sendOptions } = options;
        const { ...sendOptions } = options;

        // Handle special cases for alias overrides
        if (sendOptions.to && typeof sendOptions.to === 'string' && sendOptions.to.endsWith('.json')) {
          sendOptions.to = handleRecipientsFromFile(path.resolve(process.cwd(), sendOptions.to));
        }

        if (sendOptions.html && typeof sendOptions.html === 'string' && sendOptions.html.endsWith('.html')) {
          sendOptions.html = handleHtmlFromFile(path.resolve(process.cwd(), sendOptions.html));
        }

        if (sendOptions.attachments) {
          sendOptions.attachments = handleAttachments(sendOptions.attachments);
        }

        // Trigger the event with overrides
        await postie.trigger(options.alias, sendOptions);
        console.log('Email sent successfully!');
        return;
      }

      // Continue with normal send flow
      const mergedOptions = mergeOptions(options, rcConfig);

      // Step 3: Validate required options
      validateEmailOptions(mergedOptions);

      // Step 4: Handle special cases
      if (typeof mergedOptions.to === 'string' && mergedOptions.to.endsWith('.json')) {
        mergedOptions.to = handleRecipientsFromFile(path.resolve(process.cwd(), mergedOptions.to));
      }

      if (typeof mergedOptions.html === 'string' && mergedOptions.html.endsWith('.html')) {
        mergedOptions.html = handleHtmlFromFile(path.resolve(process.cwd(), mergedOptions.html));
      }

      if (mergedOptions.attachments) {
        mergedOptions.attachments = handleAttachments(mergedOptions.attachments);
      }

      // Send email with final options
      await postie.send(mergedOptions);
      console.log('Email sent successfully!');
    } catch (error) {
      console.error('Error sending email:', error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
