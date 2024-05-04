import chai, { expect } from 'chai'
import identity from 'lodash/identity'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as _db from './db'
import * as _jsonBase64 from './lib/json-base64'
import * as _randomBase64 from './lib/random-base64'
import * as secrets from './secrets'

chai.use(sinonChai)

describe('secrets', () => {
  afterEach(() => {
    sinon.restore()
    secrets.clear()
  })

  describe('.generate()', () => {
    let randomBase64: sinon.SinonStub

    beforeEach(() => {
      randomBase64 = sinon.stub(_randomBase64, 'randomBase64')
    })

    it('generates a new set of secrets', () => {
      randomBase64
        .onFirstCall()
        .returns('one')
        .onSecondCall()
        .returns('two')
        .onThirdCall()
        .returns('three')
        .onCall(3)
        .returns('four')
        .throws(new Error('Unexpected call'))

      expect(secrets.generate()).to.deep.equal({
        startSecret: 'one',
        chatSecret: 'two',
        nickPepper: 'three',
        chatHashPepper: 'four',
      })
    })
  })

  describe('.init()', () => {
    let dbGetSecrets: sinon.SinonStub
    let dbSetSecrets: sinon.SinonStub
    let decodeJson: sinon.SinonStub
    let encodeJson: sinon.SinonStub
    let secretsGenerate: sinon.SinonStub

    beforeEach(() => {
      dbGetSecrets = sinon.stub(_db, 'getSecrets')
      dbSetSecrets = sinon.stub(_db, 'setSecrets')
      decodeJson = sinon.stub(_jsonBase64, 'decodeJson')
      encodeJson = sinon.stub(_jsonBase64, 'encodeJson')
      secretsGenerate = sinon.stub(secrets, 'generate')
    })

    it('throws an error if already initialized', async () => {
      dbGetSecrets.resolves('fakeEncoded')
      decodeJson.withArgs('fakeEncoded').returns('fakeSecrets')

      await secrets.init()

      const err = await secrets.init().catch(identity)
      expect(err).to.be.an.instanceOf(Error)
    })

    it('first tries to get secrets from the database', async () => {
      dbGetSecrets.resolves('fakeEncoded')
      decodeJson.withArgs('fakeEncoded').returns('fakeSecrets')

      await secrets.init()

      expect(decodeJson).to.have.been.calledOnceWithExactly('fakeEncoded')
      expect(secrets.secrets).to.equal('fakeSecrets')
      expect(dbSetSecrets).not.to.have.been.called
      expect(secretsGenerate).not.to.have.been.called
      expect(encodeJson).not.to.have.been.called
    })

    it('generates new secrets if none are found', async () => {
      dbGetSecrets.resolves(null)
      secretsGenerate.returns('fakeSecrets')
      encodeJson.withArgs('fakeSecrets').returns('fakeEncoded')

      await secrets.init()

      expect(secretsGenerate).to.have.been.calledOnce
      expect(encodeJson).to.have.been.calledOnceWithExactly('fakeSecrets')
      expect(dbSetSecrets).to.have.been.calledOnceWithExactly('fakeEncoded')
    })
  })

  describe('.get()', () => {
    it('throws an error if secrets are not initialized', () => {
      sinon.stub(secrets, 'secrets').value(null)
      expect(() => secrets.get('startSecret')).to.throw(
        'Secrets not initialized',
      )
    })

    it('throws an error if the secret is not found', () => {
      sinon.stub(secrets, 'secrets').value({})
      expect(() => secrets.get('unknown' as any)).to.throw(/not found/i)
    })

    it('returns the secret', () => {
      sinon.stub(secrets, 'secrets').value({ known: 'knownSecret' })
      expect(secrets.get('known' as any)).to.equal('knownSecret')
    })
  })
})
