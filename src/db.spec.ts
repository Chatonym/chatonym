import chai, { expect } from 'chai'
import initKnex from 'knex'
import identity from 'lodash/identity'
import noop from 'lodash/noop'
import sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as db from './db'

chai.use(sinonChai)

describe('db', () => {
  beforeEach(() =>
    sinon.stub(db, 'getKnexConfig').returns({
      client: 'better-sqlite3',
      connection: { filename: ':memory:' },
      useNullAsDefault: true,
    }),
  )

  afterEach(() => sinon.restore())

  describe('.prepareConnection()', () => {
    it('enforces foreign key constraints', (done) => {
      const pragma = sinon.fake()
      db.prepareConnection({ pragma }, () => {
        expect(pragma).to.have.been.calledOnceWithExactly('foreign_keys = ON')
        done()
      })
    })
  })

  describe('.getKnexConfig()', () => {
    it('returns a valid Knex configuration object', async () => {
      const config = db.getKnexConfig()
      const knex = initKnex(config)
      await knex.select(1)
      await knex.destroy()
    })
  })

  describe('.internalInit()', () => {
    let processOff: sinon.SinonStub
    let processOnce: sinon.SinonStub
    let createTerminatedChatTable: sinon.SinonStub
    let createSecretsTable: sinon.SinonStub

    beforeEach(() => {
      processOff = sinon.stub(process, 'off')
      processOnce = sinon.stub(process, 'once')
      createTerminatedChatTable = sinon.stub(db, 'createTerminatedChatTable')
      createSecretsTable = sinon.stub(db, 'createSecretsTable')
    })

    it('creates the tables', async () => {
      await db.internalInit()
      expect(createTerminatedChatTable).to.have.been.calledOnce
      expect(createSecretsTable).to.have.been.calledOnce
    })

    it('registers the destroy handler', async () => {
      await db.internalInit()
      expect(processOff).to.have.been.calledOnceWithExactly(
        'beforeExit',
        db.destroyKnex,
      )
      expect(processOnce).to.have.been.calledOnceWithExactly(
        'beforeExit',
        db.destroyKnex,
      )
    })

    it('returns a functional knex instance', async () => {
      const knex = await db.internalInit()
      await knex.select(1)
      await knex.destroy()
    })
  })

  describe('.destroyKnex()', () => {
    let initCacheGet: sinon.SinonStub
    let initCacheClear: sinon.SinonStub

    beforeEach(() => {
      initCacheGet = sinon.stub(db.init.cache, 'get')
      initCacheClear = sinon.stub(db.init.cache, 'clear')
    })

    it('clears the init cache', async () => {
      await db.destroyKnex()
      expect(initCacheClear).to.have.been.calledOnce
    })

    it('does nothing if the cache is empty', async () => {
      await db.destroyKnex()
      expect(initCacheGet).to.have.been.calledOnce
    })

    it('destroys the knex instance', async () => {
      const destroy = sinon.fake()
      initCacheGet.returns({ destroy })
      await db.destroyKnex()
      expect(destroy).to.have.been.calledOnce
    })

    it("doesn't throw if the destroy fails", async () => {
      const destroy = sinon.fake.throws(new Error('any error'))
      initCacheGet.returns({ destroy })
      await db.destroyKnex()
    })
  })

  describe('.createTerminatedChatTable()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex?.destroy())

    it('creates the table only once', async () => {
      await db.createTerminatedChatTable(knex)
      await db.createTerminatedChatTable(knex)

      await knex(db.TERMINATED_CHAT).insert({ chatHash: 'foo' })
      await db.createTerminatedChatTable(knex)

      const res = await knex(db.TERMINATED_CHAT).count({ n: '*' }).first()
      expect(res?.n).to.equal(1)
    })
  })

  describe('.createSecretsTable()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex.destroy())

    it('creates the table only once', async () => {
      await db.createSecretsTable(knex)
      await db.createSecretsTable(knex)

      await knex(db.SECRETS).insert({ secrets: 'bar' })
      await db.createSecretsTable(knex)

      const res = await knex(db.SECRETS).count({ n: '*' }).first()
      expect(res?.n).to.equal(1)
    })
  })

  describe('.terminate()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex.destroy())

    it('inserts the chatHash', async () => {
      await db.createTerminatedChatTable(knex)
      await db.terminate('foo', knex)

      const res = await knex(db.TERMINATED_CHAT).select(1)
      expect(res).to.have.length(1)
    })

    it('ignores duplicates', async () => {
      await db.createTerminatedChatTable(knex)
      await db.terminate('foo', knex)
      await db.terminate('foo', knex)

      const res = await knex(db.TERMINATED_CHAT).select(1)
      expect(res).to.have.length(1)
    })
  })

  describe('.isTerminated()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex.destroy())

    it('returns true if the chatHash is present', async () => {
      await db.createTerminatedChatTable(knex)
      await db.terminate('foo', knex)

      const res = await db.isTerminated('foo', knex)
      expect(res).to.be.true
    })

    it('returns false if the chatHash is missing', async () => {
      await db.createTerminatedChatTable(knex)

      const res = await db.isTerminated('foo', knex)
      expect(res).to.be.false
    })
  })

  describe('.getSecrets()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex.destroy())

    it('returns null if no secrets are found', async () => {
      await db.createSecretsTable(knex)

      const res = await db.getSecrets(knex)
      expect(res).to.be.null
    })

    it('returns the secrets if they are found', async () => {
      await db.createSecretsTable(knex)
      await knex(db.SECRETS).insert({ secrets: 'foo' })

      const res = await db.getSecrets(knex)
      expect(res).to.equal('foo')
    })

    it('throws if there are multiple secrets', async () => {
      await db.createSecretsTable(knex)
      await knex(db.SECRETS).insert({ secrets: 'foo' })
      await knex(db.SECRETS).insert({ secrets: 'bar' })

      const err = await db.getSecrets(knex).then(noop, identity)
      expect(err).to.be.an.instanceOf(Error)
    })
  })

  describe('.setSecrets()', () => {
    let knex: initKnex.Knex

    beforeEach(() => (knex = initKnex(db.getKnexConfig())))
    afterEach(async () => await knex.destroy())

    it('throws if the secrets already exist', async () => {
      await db.createSecretsTable(knex)
      await knex(db.SECRETS).insert({ secrets: 'foo' })

      const err = await db.setSecrets('bar', knex).then(noop, identity)
      expect(err).to.be.an.instanceOf(Error)
    })

    it('inserts the secrets', async () => {
      await db.createSecretsTable(knex)
      await db.setSecrets('foo', knex)

      const res = await knex(db.SECRETS).select(1)
      expect(res).to.have.length(1)
    })
  })
})
