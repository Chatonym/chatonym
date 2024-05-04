export const zeroPadBuffer = (buf: Buffer, n: number) => {
  const delta = n - buf.length
  return delta > 0 ? Buffer.concat([Buffer.alloc(delta), buf]) : buf
}

export const bufferToUInt64Array = (
  buf: Buffer,
  n = Math.ceil(buf.length / 8),
) => {
  buf = zeroPadBuffer(buf, n * 8)
  return Array.from({ length: n }, (_, i) => buf.readBigUInt64BE(i * 8))
}
