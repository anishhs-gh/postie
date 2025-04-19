const Postie = require('../src')
const nodemailer = require('nodemailer')
const path = require('path')
const fs = require('fs')

// Mock nodemailer
jest.mock('nodemailer')

describe('Postie', () => {
  let postie

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })

    // Create a new instance for each test
    postie = new Postie()
  })

  describe('configure', () => {
    it('should configure with provided settings', () => {
      const config = {
        devMode: true,
        retryAttempts: 5,
        retryDelay: 2000
      }

      postie.configure(config)

      expect(postie.config).toEqual({
        devMode: true,
        retryAttempts: 5,
        retryDelay: 2000
      })
    })
  })

  describe('setTransporter', () => {
    it('should set up transporter with provided config', () => {
      const transporterConfig = {
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      }

      postie.setTransporter(transporterConfig)

      expect(nodemailer.createTransport).toHaveBeenCalledWith(transporterConfig)
      expect(postie.transporter).toBeDefined()
    })
  })

  describe('send', () => {
    it('should throw error if transporter not configured', async () => {
      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      await expect(postie.send(emailOptions)).rejects.toThrow('Transporter not configured')
    })

    it('should send a basic email', async () => {
      postie.setTransporter({
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      const result = await postie.send(emailOptions)

      expect(result.success).toBe(true)
      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: emailOptions.from,
          to: emailOptions.to,
          subject: emailOptions.subject,
          text: emailOptions.text
        })
      )
    })

    it('should handle dev mode', async () => {
      postie.configure({ devMode: true })
      postie.setTransporter({
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      })
      
      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      const result = await postie.send(emailOptions)

      expect(result.devMode).toBe(true)
      expect(result.email).toEqual(expect.objectContaining(emailOptions))
      expect(nodemailer.createTransport().sendMail).not.toHaveBeenCalled()
    })

    it('should retry on failure', async () => {
      const mockSendMail = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce({ messageId: 'test-message-id' })

      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail })

      postie.setTransporter({
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      })

      postie.configure({ retryAttempts: 3, retryDelay: 0 })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      const result = await postie.send(emailOptions)

      expect(result.success).toBe(true)
      expect(mockSendMail).toHaveBeenCalledTimes(3)
    })
  })

  describe('sendTemplate', () => {
    test('should throw error if template not provided', async () => {
      const emailOptions = {
        from: 'test@example.com',
        to: 'recipient@example.com',
        subject: 'Test',
        data: { name: 'World' }
      }

      await expect(postie.sendTemplate(emailOptions)).rejects.toThrow('Template not provided')
    })
  })

  describe('middleware', () => {
    beforeEach(() => {
      postie = new Postie()
      postie.setTransporter({
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      })
    })

    it('should execute middleware in order', async () => {
      const executionOrder = []
      
      postie.use((email, next) => {
        executionOrder.push(1)
        next()
      })
      
      postie.use((email, next) => {
        executionOrder.push(2)
        next()
      })
      
      postie.use((email, next) => {
        executionOrder.push(3)
        next()
      })

      await postie.send({
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      })

      expect(executionOrder).toEqual([1, 2, 3])
    })

    it('should allow middleware to modify email options', async () => {
      postie.use((email, next) => {
        email.subject = 'Modified Subject'
        next()
      })

      postie.use((email, next) => {
        email.headers = {
          'X-Custom-Header': 'value'
        }
        next()
      })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Original Subject',
        text: 'Test Message'
      }

      await postie.send(emailOptions)

      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Modified Subject',
          headers: {
            'X-Custom-Header': 'value'
          }
        })
      )
    })

    it('should handle async middleware', async () => {
      postie.use(async (email, next) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        email.subject = 'Async Modified'
        next()
      })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Original Subject',
        text: 'Test Message'
      }

      await postie.send(emailOptions)

      expect(nodemailer.createTransport().sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Async Modified'
        })
      )
    })

    it('should handle middleware errors', async () => {
      postie.use((email, next) => {
        throw new Error('Middleware error')
      })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      await expect(postie.send(emailOptions)).rejects.toThrow('Middleware error')
    })

    it('should not execute middleware in dev mode', async () => {
      postie.configure({ devMode: true })
      
      let middlewareExecuted = false
      postie.use((email, next) => {
        middlewareExecuted = true
        next()
      })

      const emailOptions = {
        from: 'sender@example.com',
        to: 'recipient@example.com',
        subject: 'Test Subject',
        text: 'Test Message'
      }

      await postie.send(emailOptions)
      expect(middlewareExecuted).toBe(false)
    })
  })
})

describe('Template Engine', () => {
  let postie

  beforeEach(() => {
    postie = new Postie()
    postie.configure({ devMode: true }) // Enable dev mode to get email object in result
    postie.setTransporter({
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      auth: {
        user: 'test@example.com',
        pass: 'test-password'
      }
    })
  })

  test('should throw error if template not provided', async () => {
    const handlebarsEngine = {
      compile: require('handlebars').compile,
      render: (compiled, data) => compiled(data)
    }
    postie.setTemplateEngine(handlebarsEngine)

    const emailOptions = {
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      data: { name: 'World' }
    }

    await expect(postie.sendTemplate(emailOptions)).rejects.toThrow('Template not provided')
  })

  test('should work with Handlebars', async () => {
    const Handlebars = require('handlebars')
    // Adapt Handlebars to match our interface
    const handlebarsEngine = {
      compile: Handlebars.compile,
      render: (compiled, data) => compiled(data)
    }
    postie.setTemplateEngine(handlebarsEngine)

    const result = await postie.sendTemplate({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      template: 'Hello {{name}}!',
      data: { name: 'World' }
    })

    expect(result.success).toBe(true)
    expect(result.devMode).toBe(true)
    expect(result.email.html).toBe('Hello World!')
  })

  test('should work with custom template engine', async () => {
    const customEngine = {
      compile: (template) => template,
      render: (template, data) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
      }
    }

    postie.setTemplateEngine(customEngine)

    const result = await postie.sendTemplate({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      template: 'Hello {{name}}!',
      data: { name: 'World' }
    })

    expect(result.success).toBe(true)
    expect(result.devMode).toBe(true)
    expect(result.email.html).toBe('Hello World!')
  })

  test('should work with template engine without compile method', async () => {
    const simpleEngine = {
      render: (template, data) => {
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => data[key] || match)
      }
    }

    postie.setTemplateEngine(simpleEngine)

    const result = await postie.sendTemplate({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      template: 'Hello {{name}}!',
      data: { name: 'World' }
    })

    expect(result.success).toBe(true)
    expect(result.devMode).toBe(true)
    expect(result.email.html).toBe('Hello World!')
  })

  test('should throw error for invalid template engine', () => {
    expect(() => {
      postie.setTemplateEngine(null)
    }).toThrow('Template engine must be an object')

    expect(() => {
      postie.setTemplateEngine({})
    }).toThrow('Template engine must implement render method')
  })

  test('should throw error when template engine not set', async () => {
    await expect(postie.sendTemplate({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      template: 'Hello {{name}}!',
      data: { name: 'World' }
    })).rejects.toThrow('Template engine not configured')
  })

  test('should work with template file', async () => {
    const handlebarsEngine = {
      compile: require('handlebars').compile,
      render: (compiled, data) => compiled(data)
    }
    postie.setTemplateEngine(handlebarsEngine)

    // Create a temporary template file
    const templatePath = path.join(__dirname, 'test-template.hbs')
    fs.writeFileSync(templatePath, 'Hello {{name}}!')

    const result = await postie.sendTemplate({
      from: 'test@example.com',
      to: 'recipient@example.com',
      subject: 'Test',
      template: templatePath,
      data: { name: 'World' }
    })

    expect(result.success).toBe(true)
    expect(result.devMode).toBe(true)
    expect(result.email.html).toBe('Hello World!')

    // Clean up
    fs.unlinkSync(templatePath)
  })
}) 