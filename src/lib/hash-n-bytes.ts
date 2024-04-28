import { createHash } from 'crypto'

export const hashNBytes = (algo: string, input: string, nBytes: number) => {
  let hash = createHash(algo).update(input).digest()

  const repetitions = Math.ceil(nBytes / hash.length)
  if (repetitions > 1) {
    hash = Buffer.concat(Array(repetitions).fill(hash))
  }

  if (hash.length === nBytes) {
    return hash
  }

  return hash.subarray(0, nBytes)
}
