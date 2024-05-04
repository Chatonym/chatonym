import { expect } from 'chai'

import { randomUInt32 } from './random-uint32'

describe('lib/random-uint32', () => {
  describe('.randomUint32()', () => {
    it('returns a random 32-bit unsigned integer', () => {
      const actual = randomUInt32()

      for (let i = 0; i < 1000; i++) {
        expect(randomUInt32()).to.not.equal(actual)
        expect(actual).to.be.a('number')
        expect(actual).to.be.at.least(0)
        expect(actual).to.be.at.most(2 ** 32 - 1)
      }
    })
  })
})
