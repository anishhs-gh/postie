const nodemailer = require('nodemailer')
const fs = require('fs')
const path = require('path')

class Postie {
  constructor() {
    this.config = {
      devMode: false,
      retryAttempts: 3,
      retryDelay: 1000,
      templateEngine: null, // Default to no template engine
    }
    this.middleware = [];
    this.transporter = null;
    this.logger = {
      info: (msg) => console.log(`[INFO] ${new Date().toISOString()} - ${msg}`),
      debug: (msg) => console.log(`[DEBUG] ${new Date().toISOString()} - ${msg}`),
      error: (msg) => console.error(`[ERROR] ${new Date().toISOString()} - ${msg}`),
    }
  }

  configure(config) {
    this.config = { ...this.config, ...config }
    return this;
  }

  use(middleware) {
    this.middleware.push(middleware)
    return this;
  }

  setTransporter(transporterConfig) {
    // Ensure password is trimmed
    if (transporterConfig.auth && transporterConfig.auth.pass) {
      transporterConfig.auth.pass = transporterConfig.auth.pass.trim()
    }
    this.transporter = nodemailer.createTransport(transporterConfig)
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
    if (typeof engine.compile !== 'function') {
      throw new Error('Template engine must have a compile method')
    }
    this.config.templateEngine = engine;
    return this;
  }

  formatEmailAddress(email, name) {
    if (!email) return null;
    if (!name) return email;
    return `"${name}" <${email}>`;
  }

  async send(options) {
    try {
      if (!this.transporter) {
        throw new Error('Transporter not configured. Please call setTransporter() first.')
      }

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

      // Apply middleware
      for (const fn of this.middleware) {
        await fn(email)
      }

      if (this.config.devMode) {
        this.logger.info('Dev mode enabled - email not sent')
        this.logger.debug('Email object:', JSON.stringify(email, null, 2))
        return { success: true, devMode: true, email }
      }

      let attempts = 0;
      while (attempts < this.config.retryAttempts) {
        try {
          const info = await this.transporter.sendMail(email)
          this.logger.info(`Email sent successfully to ${email.to}`)
          return { success: true, info }
        } catch (error) {
          attempts++;
          if (attempts === this.config.retryAttempts) {
            throw error;
          }
          this.logger.error(`Attempt ${attempts} failed: ${error.message}`)
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay))
        }
      }
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`)
      throw error;
    }
  }

  async sendTemplate(options) {
    const { template, data, ...emailOptions } = options;
    
    try {
      if (!this.config.templateEngine) {
        throw new Error('Template engine not configured. Please call setTemplateEngine() first.')
      }

      if (!template) {
        throw new Error('Template path is required for sendTemplate')
      }

      const templatePath = path.resolve(process.cwd(), template)
      const templateContent = fs.readFileSync(templatePath, 'utf8')
      const compiledTemplate = this.config.templateEngine.compile(templateContent)
      const html = compiledTemplate(data)

      return this.send({
        ...emailOptions,
        html,
      })
    } catch (error) {
      this.logger.error(`Failed to send template email: ${error.message}`)
      throw error;
    }
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

module.exports = new Postie() 