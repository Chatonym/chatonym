import { expect } from 'chai'

import * as links from './links'

describe('lib/links', () => {
  describe('.createBotLink()', () => {
    it('returns a bot link with requested querystring params', () => {
      const link = links.createBotLink('botfather', { foo: 'bar' })
      expect(link).to.be.equal('https://botfather.t.me?foo=bar')
    })
  })

  describe('.createStartLink()', () => {
    it('returns a start link', () => {
      const link = links.createStartLink('botfather', 'abcd')
      expect(link).to.be.equal('https://botfather.t.me?start=abcd')
    })
  })

  describe('.createChatLink()', () => {
    it('returns a chat link', () => {
      const link = links.createChatLink('botfather', 'abcd')
      expect(link).to.be.equal('https://botfather.t.me?chat=abcd')
    })
  })

  describe('.tryCreatingUrl()', () => {
    it('returns null when the input is not a valid URL', () => {
      const invalidInputs = [
        null,
        undefined,
        '',
        '/foo/bar',
        'http//not_a_valid_url',
      ]

      for (const inv of invalidInputs) {
        expect(links.tryCreatingUrl(inv as string)).to.be.null
      }
    })

    it('returns a URL object when the input is a valid URL', () => {
      const validInputs = [
        'https://example.com',
        'https://example.com?foo=bar',
        's3://example.com',
        'ftp://example.com',
      ]

      for (const url of validInputs) {
        expect(links.tryCreatingUrl(url)).to.be.an.instanceOf(URL)
      }
    })
  })

  describe('.parseChatToken()', () => {
    context('returns null if...', () => {
      it('the input is not a valid URL', () => {
        const actual = links.parseChatToken('botfather', 'not_a_valid_url')
        expect(actual).to.be.null
      })

      it('the protocol is not HTTPS', () => {
        const actual = links.parseChatToken(
          'botfather',
          'http://t.me/botfather?chat=abcd',
        )
        expect(actual).to.be.null
      })

      it('the origin is not {botname}.t.me', () => {
        const actual = links.parseChatToken(
          'botfather',
          'https://godfather.t.me?chat=abcd',
        )
        expect(actual).to.be.null
      })

      it('the pathname is not /', () => {
        const actual = links.parseChatToken(
          'botfahter',
          'https://botfather.t.me/x?chat=abcd',
        )
        expect(actual).to.be.null
      })
    })

    it('returns the chat token (t.me/{botname} style)', () => {
      const chatLink = 'https://t.me/botfather?chat=abcd'
      const chatToken = links.parseChatToken('botfather', chatLink)
      expect(chatToken).to.be.equal('abcd')
    })

    it('returns the chat token ({botname}.t.me style)', () => {
      const chatLink = 'https://botfather.t.me?chat=abcd'
      const chatToken = links.parseChatToken('botfather', chatLink)
      expect(chatToken).to.be.equal('abcd')
    })
  })
})
