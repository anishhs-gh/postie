const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

class Postie {
  constructor() {
    this.config = {
      devMode: false,
      retryAttempts: 3,
      retryDelay: 1000
    }
    this.middleware = [];
    this.transporter = null;
    this.templateEngine = null;
    this.logger = {
      info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
      debug: (msg) => console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`),
      error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`)
    }
  }

  configure(config) {
    // Only update the config properties that are allowed
    this.config = {
      ...this.config,
      devMode: config.devMode ?? this.config.devMode,
      retryAttempts: config.retryAttempts ?? this.config.retryAttempts,
      retryDelay: config.retryDelay ?? this.config.retryDelay
    }
    return this;
  }

  use(middleware) {
    this.middleware.push(middleware)
    return this;
  }

  setTransporter(config) {
    this.transporter = nodemailer.createTransport(config)
    return this;
  }

  async testConnection() {
    try {
      if (!this.transporter) {
        throw new Error('Transporter not configured. Please call setTransporter() first.')
      }

      await this.transporter.verify()
      this.logger.info('SMTP connection test successful')
      return true;
    } catch (error) {
      this.logger.error('SMTP Connection Test Failed:', error.message)
      if (error.code === 'EAUTH') {
        this.logger.error('\nAuthentication failed. Please check:')
        this.logger.error('1. Your email and password are correct')
        this.logger.error('2. If using Gmail:')
        this.logger.error('   - 2-Step Verification is enabled')
        this.logger.error('   - You\'re using an App Password (not your regular password)')
        this.logger.error('   - The App Password was generated for "Mail" and your device')
      }
      return false;
    }
  }

  setTemplateEngine(engine) {
    if (!engine || typeof engine !== 'object') {
      throw new Error('Template engine must be an object')
    }
    if (typeof engine.render !== 'function') {
      throw new Error('Template engine must implement render method')
    }
    this.templateEngine = engine
  }

  formatEmailAddress(email, name) {
    if (!email) return null;
    if (!name) return email;
    return `"${name}" <${email}>`;
  }

  async send(options) {
    if (!this.transporter) {
      throw new Error('Transporter not configured. Please call setTransporter() first.')
    }

    if (this.config.devMode) {
      this.logger.info('Dev mode enabled - email not sent')
      this.logger.debug('Email object:', options)
      return { success: true, devMode: true, email: options }
    }

    // Format email addresses
    const email = {
      from: typeof options.from === 'object' && options.from.email
        ? this.formatEmailAddress(options.from.email, options.from.name)
        : this.formatEmailAddress(options.from, options.fromName),
      to: Array.isArray(options.to) 
        ? options.to.map(addr => typeof addr === 'string' ? addr : this.formatEmailAddress(addr.email, addr.name))
        : typeof options.to === 'object' && options.to.email
          ? this.formatEmailAddress(options.to.email, options.to.name)
          : this.formatEmailAddress(options.to, options.toName),
      cc: options.cc ? (Array.isArray(options.cc)
        ? options.cc.map(addr => typeof addr === 'string' ? addr : this.formatEmailAddress(addr.email, addr.name))
        : typeof options.cc === 'object' && options.cc.email
          ? this.formatEmailAddress(options.cc.email, options.cc.name)
          : this.formatEmailAddress(options.cc, options.ccName)) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc)
        ? options.bcc.map(addr => typeof addr === 'string' ? addr : this.formatEmailAddress(addr.email, addr.name))
        : typeof options.bcc === 'object' && options.bcc.email
          ? this.formatEmailAddress(options.bcc.email, options.bcc.name)
          : this.formatEmailAddress(options.bcc, options.bccName)) : undefined,
      subject: options.subject || 'No Subject',
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    }

    // Execute middleware chain
    let middlewareIndex = 0;
    const next = async () => {
      if (middlewareIndex < this.middleware.length) {
        const middleware = this.middleware[middlewareIndex++];
        await middleware(email, next);
      }
    };

    // Start middleware chain
    await next();

    let attempts = 0
    let lastError = null

    while (attempts < this.config.retryAttempts) {
      try {
        const result = await this.transporter.sendMail(email)
        this.logger.info(`Email sent successfully to ${email.to}`)
        return { success: true, messageId: result.messageId }
      } catch (error) {
        attempts++
        lastError = error
        this.logger.error(`Attempt ${attempts} failed: ${error.message}`)
        
        if (attempts === this.config.retryAttempts) {
          throw lastError
        }
        
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
      }
    }
  }

  async sendTemplate(options) {
    if (!options.template) {
      throw new Error('Template not provided')
    }

    if (!this.templateEngine) {
      throw new Error('Template engine not configured')
    }

    let templateContent
    // Check if template is a file path or template string
    if (fs.existsSync(options.template)) {
      templateContent = fs.readFileSync(options.template, 'utf8')
    } else {
      templateContent = options.template
    }

    let compiled
    if (this.templateEngine.compile) {
      compiled = this.templateEngine.compile(templateContent)
    } else {
      compiled = templateContent
    }

    const html = this.templateEngine.render(compiled, options.data || {})

    return this.send({
      ...options,
      html
    })
  }

  notify(options) {
    return this.send({
      ...options,
      subject: `[NOTIFICATION] ${options.subject || 'New Notification'}`,
    })
  }

  alert(options) {
    return this.send({
      ...options,
      subject: `[ALERT] ${options.subject || 'New Alert'}`,
    })
  }

  ping(options) {
    return this.send({
      ...options,
      subject: 'Ping',
      text: 'Ping!',
    })
  }
}

module.exports = Postie 