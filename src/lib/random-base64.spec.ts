import { expect } from 'chai'

import { randomBase64 } from './random-base64'

describe('lib/random-base64', () => {
  describe('.randomBase64()', () => {
    it('returns a random base64 string of the specified length', () => {
      const actual = randomBase64(64)
      expect(actual.length).to.equal(86)
    })

    it('returns a valid base64url string', () => {
      for (let i = 0; i < 1000; i++) {
        const actual = randomBase64(16)
        expect(actual).to.match(/^[A-Za-z0-9_-]+$/)
      }
    })
  })
})
