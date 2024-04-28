import * as crypto from 'crypto'

import * as env from '../lib/env'
import { logger } from '../logger'

export const ALGORITHM = env.str('CRYPTO_CIPHER_ALGORITHM', 'aes-256-cbc')
export const IV_BYTES = env.uint('CRYPTO_IV_BYTES', 16)

export type WithSalt<T> = T & { salt: string }

export type WithoutSeed<T> = Omit<T, 'seed'>

export const generateIv = () => crypto.randomBytes(IV_BYTES)

export const encrypt = (
  secret: crypto.KeyObject,
  data: Buffer,
  iv = generateIv(),
) => {
  const ciph = crypto.createCipheriv(ALGORITHM, secret, iv)

  try {
    const tokenBuf = Buffer.concat([iv, ciph.update(data), ciph.final()])
    return tokenBuf.toString('base64url')
  } catch (err: any) {
    logger.error(err.stack)
  }

  return null
}

export const decrypt = (secret: crypto.KeyObject, token: string) => {
  try {
    const tokenBuf = Buffer.from(token, 'base64url')
    const iv = tokenBuf.subarray(0, IV_BYTES)
    const encryptedData = tokenBuf.subarray(IV_BYTES)

    const deciph = crypto.createDecipheriv(ALGORITHM, secret, iv)
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
