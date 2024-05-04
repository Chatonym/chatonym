import { expect } from 'chai'
import { createSecretKey } from 'crypto'
import sinon from 'sinon'

import * as _env from '../lib/env'
import * as base from './base'

const TEST_IV_BYTES = 16
const TEST_CIPHER_ALGORITHM = 'aes-256-cbc'
const TEST_SECRET_KEY = createSecretKey('ab'.repeat(32), 'hex')
const TEST_IV = Buffer.from('cd'.repeat(TEST_IV_BYTES), 'hex')

const TEST_DATA = Buffer.from('hello world', 'utf8')

describe('crypto/base', () => {
  beforeEach(() => {
    sinon.stub(_env, 'uint').withArgs('CRYPTO_IV_BYTES').returns(TEST_IV_BYTES)
    sinon
      .stub(_env, 'str')
      .withArgs('CRYPTO_CIPHER_ALGORITHM')
      .returns(TEST_CIPHER_ALGORITHM)
  })

  afterEach(() => sinon.restore())

  describe('.generateIv()', () => {
    it('generates a random IV', () => {
      expect(base.generateIv()).to.have.lengthOf(16)
    })
  })

  describe('.encrypt()', () => {
    it('encrypts data', () => {
      const result = base.encrypt(TEST_SECRET_KEY, TEST_DATA, TEST_IV)
      expect(result).to.be.a('string')
    })
  })

  describe('.decrypt()', () => {
    it('decrypts data', () => {
      const encrypted = base.encrypt(TEST_SECRET_KEY, TEST_DATA, TEST_IV)!
      const result = base.decrypt(TEST_SECRET_KEY, encrypted)
      expect(result).to.deep.equal({
        data: TEST_DATA,
        iv: TEST_IV.toString('base64url'),
      })
    })

    it('returns null on error', () => {
      const fn = () => base.decrypt(TEST_SECRET_KEY, 'a'.repeat(64))
      expect(fn()).to.be.null
    })
  })
})
