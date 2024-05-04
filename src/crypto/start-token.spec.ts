import chai, { expect } from 'chai'
import { createSecretKey } from 'crypto'
import sinon from 'sinon'
import sinonChain from 'sinon-chai'

import * as base from './base'
import * as startTokenCrypto from './start-token'

chai.use(sinonChain)

const TEST_SECRET_KEY = createSecretKey('ab'.repeat(32), 'hex')

describe('crypto/start-token', () => {
  describe('.cacheKey()', () => {
    it('returns recipientId', () => {
      const result = startTokenCrypto.cacheKey({ recipientId: 1 })
      expect(result).to.equal(1)
    })
  })

  describe('.serialize()', () => {
    it('throws if recipientId is not a safe int', () => {
      const fn = () =>
        startTokenCrypto.serialize({
          recipientId: Number.MAX_SAFE_INTEGER + 1,
          seed: 1,
        })
      expect(fn).to.throw(TypeError)
    })

    it('throws if seed is not a 32bit uint', () => {
      const fn = () =>
        startTokenCrypto.serialize({
          recipientId: 1,
          seed: -1,
        })
      expect(fn).to.throw(TypeError)
    })

    it('returns a buffer', () => {
      const result = startTokenCrypto.serialize({
        recipientId: 1,
        seed: 1,
      })
      expect(result).to.be.instanceOf(Buffer)
    })
  })

  describe('.deserialize()', () => {
    it('throws if buffer is too short', () => {
      const fn = () => startTokenCrypto.deserialize(Buffer.alloc(11))
      expect(fn).to.throw(TypeError)
    })

    it('throws if seed is not a 32bit uint', () => {
      const fn = () =>
        startTokenCrypto.deserialize(Buffer.from('00'.repeat(8) + 'ff', 'hex'))
      expect(fn).to.throw(TypeError)
    })

    it('returns a StartToken', () => {
      const result = startTokenCrypto.deserialize(
        Buffer.from('00'.repeat(12), 'hex'),
      )
      expect(result).to.deep.equal({
        recipientId: 0,
        seed: 0,
      })
    })

    it('is able to deserialize a serialized token', () => {
      const token = { recipientId: 1, seed: 1 }
      const serialized = startTokenCrypto.serialize(token)
      const deserialized = startTokenCrypto.deserialize(serialized)
      expect(deserialized).to.deep.equal(token)
    })
  })

  describe('.getStartSecretKey()', () => {})

  describe('.encrypt()', () => {
    let getSecretKey: sinon.SinonStub
    let baseEncrypt: sinon.SinonStub
    let serialize: sinon.SinonStub
    let cacheGet: sinon.SinonStub
    let cacheSet: sinon.SinonStub

    beforeEach(() => {
      getSecretKey = sinon.stub(startTokenCrypto, 'getStartSecretKey')
      baseEncrypt = sinon.stub(base, 'encrypt')
      serialize = sinon.stub(startTokenCrypto, 'serialize')
      cacheGet = sinon.stub(startTokenCrypto.CACHE, 'get')
      cacheSet = sinon.stub(startTokenCrypto.CACHE, 'set')
    })

    afterEach(() => sinon.restore())

    it('returns cached value', () => {
      cacheGet.withArgs(1).returns('cached')
      const result = startTokenCrypto.encrypt({ recipientId: 1 })
      expect(result).to.equal('cached')
    })

    it('encrypts and caches value', () => {
      const st = { recipientId: 1 }
      const serialized = Buffer.from('serialized')
      const encrypted = 'encrypted'

      const stMatch = sinon.match({
        ...st,
        seed: sinon.match.number,
      })

      getSecretKey.returns('secretKey')
      serialize.withArgs(stMatch).returns(serialized)
      baseEncrypt.withArgs('secretKey', serialized).returns(encrypted)

      const res = startTokenCrypto.encrypt(st)

      expect(res).to.equal(encrypted)
      expect(cacheSet).to.have.been.calledOnceWithExactly(1, encrypted)
    })

    it("doesn't cache on error", () => {
      const st = { recipientId: 1 }
      const serialized = Buffer.from('serialized')

      const stMatch = sinon.match({
        ...st,
        seed: sinon.match.number,
      })

      getSecretKey.returns('secretKey')
      serialize.withArgs(stMatch).returns(serialized)
      baseEncrypt.withArgs('secretKey', serialized).returns(null)

      const res = startTokenCrypto.encrypt(st)

      expect(res).to.be.null
      expect(cacheSet).to.not.have.been.called
    })
  })

  describe('.decrypt()', () => {
    let getSecretKey: sinon.SinonStub

    beforeEach(
      () => (getSecretKey = sinon.stub(startTokenCrypto, 'getStartSecretKey')),
    )

    afterEach(() => sinon.restore())

    it('decrypts token', () => {
      getSecretKey.returns(TEST_SECRET_KEY)

      const st = { recipientId: 1 }
      const encrypted = startTokenCrypto.encrypt(st)!
      const decrypted = startTokenCrypto.decrypt(encrypted)

      sinon.assert.match(decrypted, {
        ...st,
        salt: sinon.match.string,
      })
    })

    it('returns null on error', () => {
      const st = { recipientId: 1 }

      getSecretKey.returns(TEST_SECRET_KEY)
      const encrypted = startTokenCrypto.encrypt(st)!

      getSecretKey.returns(createSecretKey('cd'.repeat(32), 'hex'))
      const decrypted = startTokenCrypto.decrypt(encrypted)

      expect(decrypted).to.be.null
    })
  })
})
