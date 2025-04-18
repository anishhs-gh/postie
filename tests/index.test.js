const Postie = require('../src')
const nodemailer = require('nodemailer')

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
    it('should throw error if template not provided', async () => {
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
        data: { name: 'Test User' }
      }

      await expect(postie.sendTemplate(emailOptions)).rejects.toThrow('Template path is required')
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