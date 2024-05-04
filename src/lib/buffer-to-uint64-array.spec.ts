import { expect } from 'chai'

import { bufferToUInt64Array, zeroPadBuffer } from './buffer-to-uint64-array'

const ABCD = 'abcd'
const Z2F = '0123456789abcdef'
const F2Z = 'fedcba9876543210'

const BIGINT_Z2F = Buffer.from(Z2F, 'hex').readBigUInt64BE(0)
const BIGINT_F2Z = Buffer.from(F2Z, 'hex').readBigUInt64BE(0)

describe('lib/buffer-to-uint64-array', () => {
  describe('.zeroPadBuffer()', () => {
    it('returns the buffer if it has length of N bytes or more', () => {
      const buf = Buffer.from(Z2F, 'hex')
      const padded = zeroPadBuffer(buf, 8)
      expect(padded).to.equal(buf)
    })

    it("zero-pads the buffer if it's shorter than N bytes", () => {
      const buf = Buffer.from(ABCD, 'hex')
      const paddedHex = zeroPadBuffer(buf, 4).toString('hex')
      expect(paddedHex).to.equal('0000abcd')
    })
  })

  describe('.bufferToUint64Array()', () => {
    context('when the expected length is not provided...', () => {
      it('reads all possible 64-bit bigints from the buffer', () => {
        const buf = Buffer.from(ABCD + Z2F + F2Z, 'hex')
        const arr = bufferToUInt64Array(buf)

        expect(arr).to.have.length(3)

        const val1 = Buffer.from('000000000000abcd', 'hex').readBigUInt64BE(0)
        expect(arr[0]).to.equal(val1)

        const val2 = BIGINT_Z2F
        expect(arr[1]).to.equal(val2)

        const val3 = BIGINT_F2Z
        expect(arr[2]).to.equal(val3)
      })
    })

    context('when the expected length (N) is provided', () => {
      it('reads N 64-bit bigints from the buffer', () => {
        const buf1 = Buffer.from(ABCD + Z2F, 'hex')
        const arr1 = bufferToUInt64Array(buf1, 3)
        const val = Buffer.from('000000000000abcd', 'hex').readBigUInt64BE(0)
        expect(arr1).to.have.length(3)
        expect(arr1[0]).to.be.equal(0n)
        expect(arr1[1]).to.equal(val)
        expect(arr1[2]).to.equal(BIGINT_Z2F)

        const buf2 = Buffer.from(Z2F + F2Z + ABCD, 'hex')
        const arr2 = bufferToUInt64Array(buf2, 1)
        expect(arr2).to.have.length(1)
        expect(arr2[0]).to.equal(BIGINT_Z2F)
      })
    })
  })
})
