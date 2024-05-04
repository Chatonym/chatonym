import { expect } from 'chai'

import { hashNBytes } from './hash-n-bytes'

const INPUT = 'a_random_string_of_characters_to_be_hashed'

describe('lib/hash-n-bytes', () => {
  describe('.hashNBytes()', () => {
    it('returns a consistent hash for a given input', () => {
      const hash1 = hashNBytes('sha256', INPUT, 32)
      const hash2 = hashNBytes('sha256', INPUT, 32)

      expect(hash1.equals(hash2)).to.be.true
    })

    it('returns a hash of the specified length', () => {
      const hash1 = hashNBytes('sha256', INPUT, 128)
      expect(hash1.length).to.equal(128)

      const hash2 = hashNBytes('md5', INPUT, 3)
      expect(hash2.length).to.equal(3)
    })
  })
})
