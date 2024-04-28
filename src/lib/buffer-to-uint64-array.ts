export const bufferToUInt64Array = (buf: Buffer, n = -1) => {
  const maxN = Math.floor(buf.length / 8)

  if (n > maxN) {
    throw new RangeError('n is too large')
  }
  if (n < 0) {
    n = maxN
  }

  return Array.from({ length: n }, (_, i) => buf.readBigUInt64BE(i * 8))
}
