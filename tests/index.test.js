const postie = require('../src')
const nodemailer = require('nodemailer')

// Mock nodemailer
jest.mock('nodemailer')

describe('Postie', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()
    nodemailer.createTransport.mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'test-message-id' })
    })

    // Reset postie instance
    postie.transporter = null;
    postie.config = {
      devMode: false,
      retryAttempts: 3,
      retryDelay: 1000
    }
    postie.middleware = [];
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
      postie.setTransporter({
        host: 'test-host',
        port: 1234,
        secure: true,
        auth: {
          user: 'test-user',
          pass: 'test-pass'
        }
      })

      const mockSendMail = jest.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockRejectedValueOnce(new Error('Second attempt failed'))
        .mockResolvedValueOnce({ messageId: 'test-message-id' })

      nodemailer.createTransport.mockReturnValue({ sendMail: mockSendMail })

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
}) 