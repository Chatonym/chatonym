import * as crypto from 'crypto'

import * as env from '../lib/env'
import { logger } from '../logger'

export type WithSalt<T> = T & { salt: string }

export type WithoutSeed<T> = Omit<T, 'seed'>

const getAlgorithm = () => env.str('CRYPTO_CIPHER_ALGORITHM', 'aes-256-cbc')

const getIvBytes = () => env.uint('CRYPTO_IV_BYTES', 16)

export const generateIv = () => crypto.randomBytes(getIvBytes())

export const encrypt = (
  secret: crypto.KeyObject,
  data: Buffer,
  iv = generateIv(),
) => {
  const ciph = crypto.createCipheriv(getAlgorithm(), secret, iv)

  try {
    const tokenBuf = Buffer.concat([iv, ciph.update(data), ciph.final()])
    return tokenBuf.toString('base64url')
  } catch (err: any) {
    logger.error(err.stack)
  }

  return null
}

export const decrypt = (secret: crypto.KeyObject, encrypted: string) => {
  const algo = getAlgorithm()
  const ivBytes = getIvBytes()

  try {
    const tokenBuf = Buffer.from(encrypted, 'base64url')
    const iv = tokenBuf.subarray(0, ivBytes)
    const encryptedData = tokenBuf.subarray(ivBytes)

    const deciph = crypto.createDecipheriv(algo, secret, iv)
    const decrypted = Buffer.concat([
      deciph.update(encryptedData),
      deciph.final(),
    ])

    return {
      data: decrypted,
      iv: iv.toString('base64url'),
    }
  } catch (err: any) {
    logger.error(err.stack)
  }

  return null
}
