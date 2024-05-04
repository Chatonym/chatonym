import chai, { expect } from 'chai'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as _secrets from '../secrets'
import * as nick from '.'

chai.use(sinonChai)

describe('nick/index', () => {
  describe('.getPrefix()', () => {
    it('returns a prefix string', () => {
      expect(nick.getPrefix(0n)).to.be.a('string')

      for (let i = 0n; i < 21n; i++) {
        const idx = 8n ** i
        expect(nick.getPrefix(idx)).to.be.a('string')
      }
    })
  })

  describe('.getSuffix()', () => {
    it('returns a prefix string', () => {
      expect(nick.getPrefix(0n)).to.be.a('string')

      for (let i = 0n; i < 21n; i++) {
        const idx = 8n ** i
        expect(nick.getSuffix(idx)).to.be.a('string')
      }
    })
  })

  describe('.getBase32Hash()', () => {
    it('returns a base32 hash', () => {
      expect(nick.getBase32Hash(0n)).to.be.a('string')

      for (let i = 0n; i < 21n; i++) {
        const idx = 8n ** i
        expect(nick.getBase32Hash(idx)).to.be.a('string')
      }
    })
  })

  describe('.getNick()', () => {
    it('returns a nick', () => {
      const inputs = ['foobar', 'barfoo', '123456', 'abcdef']

      const nicks = inputs.map(nick.getNick)
      const uniqNicks = [...new Set(nicks)]
      expect(uniqNicks).to.have.lengthOf(nicks.length)
    })
  })

  describe('.getNickForSender()', () => {
    let secretsGet: sinon.SinonStub

    beforeEach(() => (secretsGet = sinon.stub(_secrets, 'get')))

    afterEach(() => sinon.restore())

    it('returns different nicks for different peppers', () => {
      const chat1 = { senderId: 1, recipientId: 2, seed: 3 }
      const chat2 = { senderId: 1, recipientId: 2, seed: 4 }

      secretsGet.withArgs('nickPepper').returns('pepper1')
      const nick1 = nick.getNickForSender(chat1)
      const nick2 = nick.getNickForSender(chat2)

      secretsGet.withArgs('nickPepper').returns('pepper2')
      const nick3 = nick.getNickForSender(chat1)
      const nick4 = nick.getNickForSender(chat2)

      expect(nick1).to.not.equal(nick2)
      expect(nick1).to.not.equal(nick3)
      expect(nick1).to.not.equal(nick4)
      expect(nick2).to.not.equal(nick3)
      expect(nick2).to.not.equal(nick4)
      expect(nick3).to.not.equal(nick4)
    })
  })

  describe('.getNickForRecipient()', () => {
    let getNickForSender: sinon.SinonStub

    beforeEach(() => (getNickForSender = sinon.stub(nick, 'getNickForSender')))

    afterEach(() => sinon.restore())

    it("calls getNickForSender with the sender's and recipient's IDs swapped", () => {
      const chat = { senderId: 1, recipientId: 2, seed: 3 }
      nick.getNickForRecipient(chat)
      expect(getNickForSender).to.have.been.calledOnceWithExactly({
        senderId: 2,
        recipientId: 1,
        seed: 3,
      })
    })
  })
})
