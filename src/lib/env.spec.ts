import * as chai from 'chai'
import * as sinon from 'sinon'
import sinonChai from 'sinon-chai'

import * as env from './env'

chai.use(sinonChai)
const { expect } = chai

describe('lib/env', () => {
  afterEach(() => sinon.restore())

  describe('.str()', () => {
    it('returns the env value if it exists', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = 'FAKE_VALUE'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      const actual = env.str(KEY)
      expect(actual).to.equal(VAL)
    })

    it('prefers the env value over the default value', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = 'FAKE_VALUE'
      const DEFAULT_VALUE = 'DEFAULT_VALUE'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      const actual = env.str(KEY, DEFAULT_VALUE)
      expect(actual).to.equal(VAL)
    })

    it("returns the default value if it's been provided", () => {
      const KEY = 'MISSING_ENVIRONMENT_VARIABLE'
      const DEFAULT_VALUE = 'DEFAULT_VALUE'

      sinon.stub(process, 'env').value({})

      const actual = env.str(KEY, DEFAULT_VALUE)
      expect(actual).to.equal(DEFAULT_VALUE)
    })

    it('throws if the env value is missing and no default value is provided', () => {
      const KEY = 'MISSING_ENVIRONMENT_VARIABLE'

      sinon.stub(process, 'env').value({})

      expect(() => env.str(KEY)).to.throw(/missing/i)
    })
  })

  describe('.popStr()', () => {
    it('deletes the env value after returning it', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = 'FAKE_VALUE'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      const actual = env.popStr(KEY)
      expect(actual).to.equal(VAL)
      expect(process.env).to.not.have.property(KEY)
    })
  })

  describe('.uint()', () => {
    it('returns the env value as a non-negative integer', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = '42'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      const actual = env.uint(KEY)
      expect(actual).to.equal(42)
    })

    it('throws if the env value is not a number', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = 'INVALID_VALUE'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      expect(() => env.uint(KEY)).to.throw(/invalid/i)
    })

    it('throws if the env value is negative', () => {
      const KEY = 'EXISTENT_ENVIRONMENT_VARIABLE'
      const VAL = '-42'

      sinon.stub(process, 'env').value({
        [KEY]: VAL,
      })

      expect(() => env.uint(KEY)).to.throw(/invalid/i)
    })
  })
})
