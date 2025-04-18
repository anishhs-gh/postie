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
    this.templateEngine = engine;
    return this;
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

    let attempts = 0
    let lastError = null

    while (attempts < this.config.retryAttempts) {
      try {
        const result = await this.transporter.sendMail(options)
        this.logger.info(`Email sent successfully to ${options.to}`)
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
      throw new Error('Template path is required')
    }

    if (!this.templateEngine) {
      throw new Error('Template engine not configured. Please call setTemplateEngine() first.')
    }

    const templatePath = path.resolve(options.template)
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template file not found: ${templatePath}`)
    }

    const templateContent = fs.readFileSync(templatePath, 'utf8')
    const template = this.templateEngine.compile(templateContent)
    const html = template(options.data)

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