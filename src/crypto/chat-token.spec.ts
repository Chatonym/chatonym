import chai, { expect } from 'chai'
import { createSecretKey, KeyObject } from 'crypto'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as _secrets from '../secrets'
import * as _base from './base'
import * as chatTokenCrypto from './chat-token'

chai.use(sinonChai)

const TEST_SECRET_KEY = createSecretKey('bc'.repeat(32), 'hex')

describe('crypto/chat-token', () => {
  afterEach(() => chatTokenCrypto.CACHE.clear())

  describe('.cacheKey()', () => {
    it('returns concats props by #', () => {
      const chat = { recipientId: 2, senderId: 1, seed: 3 }
      const result = chatTokenCrypto.cacheKey(chat)
      expect(result).to.equal('1#2#3')
    })
  })

  describe('.serialize()', () => {
    it('returns a buffer', () => {
      const chat = { recipientId: 1, senderId: 2, seed: 3 }
      const result = chatTokenCrypto.serialize(chat)
      expect(result).to.be.instanceOf(Buffer)
    })

    it('throws if senderId is not a safe int', () => {
      const chat = {
        recipientId: 1,
        senderId: Number.MAX_SAFE_INTEGER + 1,
        seed: 3,
      }
      const fn = () => chatTokenCrypto.serialize(chat)
      expect(fn).to.throw(TypeError)
    })
  })

  describe('.deserialize()', () => {
    it('throws if buffer is too short', () => {
      const fn = () => chatTokenCrypto.deserialize(Buffer.alloc(19))
      expect(fn).to.throw(TypeError)
    })

    it('deserializes a buffer', () => {
      const chat = { recipientId: 1, senderId: 2, seed: 3 }
      const ser = chatTokenCrypto.serialize(chat)
      const result = chatTokenCrypto.deserialize(ser)
      expect(result).to.deep.equal(chat)
    })
  })

  describe('.getChatSecretKey()', () => {
    let secretsGet: sinon.SinonStub

    beforeEach(() => (secretsGet = sinon.stub(_secrets, 'get')))

    afterEach(() => sinon.restore())

    it('returns a secret key', () => {
      secretsGet.withArgs('chatSecret').returns('ab')
      const result = chatTokenCrypto.getChatSecretKey()
      expect(result).to.be.instanceOf(KeyObject)
    })
  })

  describe('.encrypt()', () => {
    let cacheKey: sinon.SinonStub
    let cacheGet: sinon.SinonStub
    let cacheSet: sinon.SinonStub
    let baseEncrypt: sinon.SinonStub
    let getChatSecretKey: sinon.SinonStub
    let serialize: sinon.SinonStub

    const CHAT = Object.freeze({ recipientId: 1, senderId: 2, seed: 3 })

    beforeEach(() => {
      cacheKey = sinon.stub(chatTokenCrypto, 'cacheKey')
      cacheGet = sinon.stub(chatTokenCrypto.CACHE, 'get')
      cacheSet = sinon.stub(chatTokenCrypto.CACHE, 'set')
      baseEncrypt = sinon.stub(_base, 'encrypt')
      getChatSecretKey = sinon.stub(chatTokenCrypto, 'getChatSecretKey')
      serialize = sinon.stub(chatTokenCrypto, 'serialize')
    })

    afterEach(() => sinon.restore())

    it('returns cached value', () => {
      cacheKey.withArgs(CHAT).returns('key')
      cacheGet.withArgs('key').returns('cached')
      const res = chatTokenCrypto.encrypt(CHAT)

      expect(res).to.equal('cached')
      expect(getChatSecretKey).to.not.have.been.called
      expect(serialize).to.not.have.been.called
      expect(baseEncrypt).to.not.have.been.called
      expect(cacheSet).to.not.have.been.called
    })

    it('encrypts and caches value', () => {
      cacheKey.withArgs(CHAT).returns('key')
      getChatSecretKey.returns('secret')
      serialize.withArgs(CHAT).returns('serialized')
      baseEncrypt.withArgs('secret', 'serialized').returns('encrypted')

      const res = chatTokenCrypto.encrypt(CHAT)

      expect(res).to.equal('encrypted')
      expect(cacheSet).to.have.been.calledOnceWithExactly('key', 'encrypted')
    })

    it("doesn't cache on error", () => {
      cacheKey.withArgs(CHAT).returns('key')
      getChatSecretKey.returns('secret')
      serialize.withArgs(CHAT).returns('serialized')
      baseEncrypt.withArgs('secret', 'serialized').returns(null)

      const res = chatTokenCrypto.encrypt(CHAT)

      expect(res).to.be.null
      expect(cacheSet).to.not.have.been.called
    })
  })

  describe('.encryptRotated()', () => {
    let encrypt: sinon.SinonStub

    before(() => (encrypt = sinon.stub(chatTokenCrypto, 'encrypt')))

    after(() => sinon.restore())

    it('encrypts a chat with sender and recipient swapped', () => {
      const chat = { recipientId: 1, senderId: 2, seed: 3 }
      const matchSwapped = sinon.match({ ...chat, recipientId: 2, senderId: 1 })

      encrypt.withArgs(matchSwapped).returns('encrypted')
      const res = chatTokenCrypto.encryptRotated(chat)

      expect(res).to.equal('encrypted')
      expect(encrypt).to.have.been.calledOnceWithExactly(matchSwapped)
    })
  })

  describe('.decrypt()', () => {
    let getChatSecretKey: sinon.SinonStub

    beforeEach(
      () =>
        (getChatSecretKey = sinon.stub(chatTokenCrypto, 'getChatSecretKey')),
    )

    afterEach(() => sinon.restore())

    it('decrypts a chat token', () => {
      getChatSecretKey.returns(TEST_SECRET_KEY)

      const chat = { recipientId: 1, senderId: 2, seed: 3 }
      const encrypted = chatTokenCrypto.encrypt(chat)!
      const res = chatTokenCrypto.decrypt(encrypted)

      sinon.assert.match(res, {
        ...chat,
        salt: sinon.match.string,
      })
    })

    it('returns null on error', () => {
      const chat = { recipientId: 1, senderId: 2, seed: 3 }

      getChatSecretKey.returns(TEST_SECRET_KEY)
      const encrypted = chatTokenCrypto.encrypt(chat)!

      getChatSecretKey.returns(createSecretKey('ad'.repeat(32), 'hex'))
      const res = chatTokenCrypto.decrypt(encrypted)

      expect(res).to.be.null
    })
  })

  describe('.chatHash()', () => {
    let secretsGet: sinon.SinonStub

    beforeEach(() => (secretsGet = sinon.stub(_secrets, 'get')))

    afterEach(() => sinon.restore())

    it('always returns the same hash for the same chat', () => {
      secretsGet.withArgs('chatHashPepper').returns('pepper')

      const chat1 = { recipientId: 1, senderId: 2, seed: 3 }
      const chat2 = { recipientId: 1, senderId: 2, seed: 3 }

      const hash1 = chatTokenCrypto.chatHash(chat1)
      const hash2 = chatTokenCrypto.chatHash(chat1)
      const hash3 = chatTokenCrypto.chatHash(chat2)

      expect(hash1).to.equal(hash2)
      expect(hash1).to.equal(hash3)
    })

    it('returns different hashes for different chats', () => {
      const chats = [
        { recipientId: 1, senderId: 2, seed: 3 },
        { recipientId: 1, senderId: 2, seed: 4 },
        { recipientId: 1, senderId: 2, seed: -3 },
        { recipientId: 3, senderId: 2, seed: 1 },
        { recipientId: 3, senderId: 1, seed: 2 },
        { recipientId: 1, senderId: -2, seed: 3 },
        { recipientId: -1, senderId: 2, seed: 3 },
        { recipientId: -1, senderId: -2, seed: -3 },
        { recipientId: 1, senderId: 4, seed: 3 },
        { recipientId: 4, senderId: 2, seed: 3 },
      ]

      const hashes = chats.map(chatTokenCrypto.chatHash)
      const unique = new Set(hashes)
      expect(unique.size).to.equal(chats.length)
    })

    it('returns different hashes with different pepper', () => {
      const chat1 = { recipientId: 1, senderId: 2, seed: 3 }
      const chat2 = { recipientId: 1, senderId: 4, seed: 3 }

      secretsGet.withArgs('chatHashPepper').returns('pepper1')
      const hash1 = chatTokenCrypto.chatHash(chat1)

      secretsGet.withArgs('chatHashPepper').returns('pepper2')
      const hash2 = chatTokenCrypto.chatHash(chat1)

      secretsGet.withArgs('chatHashPepper').returns('pepper3')
      const hash3 = chatTokenCrypto.chatHash(chat2)

      expect(hash1).to.not.equal(hash2)
      expect(hash1).to.not.equal(hash3)
      expect(hash2).to.not.equal(hash3)
    })
  })
})
