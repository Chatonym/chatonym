import { expect } from 'chai'

import { decodeJson, encodeJson } from './json-base64'

const OBJ = Object.freeze({ foo: 'bar' })
const BASE64_OBJ = Buffer.from(JSON.stringify(OBJ)).toString('base64url')

describe('lib/json-base64', () => {
  describe('.encodeJson()', () => {
    it('converts any value to a base64url string', () => {
      expect(encodeJson(OBJ)).to.equal(BASE64_OBJ)
    })
  })

  describe('.decodeJson()', () => {
    it("throws if the input doesn't include a valid JSON", () => {
      const str = 'not a valid base64url string'
      expect(() => decodeJson(str)).to.throw(SyntaxError)
    })

    it('decodes a base64url string to its original value', () => {
      const obj = decodeJson(BASE64_OBJ)
      expect(obj).to.deep.equal(OBJ)
    })
  })
})
