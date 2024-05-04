import { createSecretKey } from 'crypto'
import memoize from 'lodash/memoize'
import { LRUCache } from 'lru-cache'

import * as env from '../lib/env'
import { randomUInt32 } from '../lib/random-uint32'
import * as secrets from '../secrets'
import * as base from './base'

type CacheKey = ReturnType<typeof cacheKey>

export interface StartToken {
  /** safe integer */
  recipientId: number

  /** 32 bit unsigned integer */
  seed: number
}

export const CACHE = new LRUCache<CacheKey, string>({
  max: env.uint('CACHE_MAX', 10000),
  ttl: env.uint('CACHE_TTL', 14400),
})

export const cacheKey = (stNoSeed: base.WithoutSeed<StartToken>) => {
  return stNoSeed.recipientId
}

export const serialize = (st: StartToken) => {
  const buf = Buffer.alloc(12)

  if (!Number.isSafeInteger(st.recipientId)) {
    throw new TypeError('recipientId must be a safe integer')
  }
  buf.writeBigInt64BE(BigInt(st.recipientId), 0)

  if (st.seed < 0 || st.seed > 0xffffffff) {
    throw new TypeError('seed must be a 32 bit unsigned integer')
  }
  buf.writeUInt32BE(st.seed, 8)

  return buf
}

export const deserialize = (buf: Buffer): StartToken => {
  if (buf.length < 12) {
    throw new TypeError('Invalid buffer length')
  }

  const userId = Number(buf.readBigInt64BE(0))
  const tokenId = buf.readUInt32BE(8)

  if (!Number.isSafeInteger(userId)) {
    throw new TypeError('Unable to extract userId from buffer')
  }
  if (tokenId < 0 || tokenId > 0xffffffff) {
    throw new TypeError('Unable to extract tokenId from buffer')
  }

  return { recipientId: userId, seed: tokenId }
}

export const getStartSecretKey = memoize(() => {
  const str = secrets.get('startSecret')
  return createSecretKey(str, 'base64url')
})

export const encrypt = (stNoSeed: base.WithoutSeed<StartToken>) => {
  const key = cacheKey(stNoSeed)
  const cached = CACHE.get(key)
  if (cached) {
    return cached
  }

  const st = { ...stNoSeed, seed: randomUInt32() }
  const encrypted = base.encrypt(getStartSecretKey(), serialize(st))
  if (encrypted) {
    CACHE.set(key, encrypted)
  }

  return encrypted
}

export const decrypt = (token: string): base.WithSalt<StartToken> | null => {
  const enc = base.decrypt(getStartSecretKey(), token)
  if (!enc) {
    return null
  }
  return { ...deserialize(enc.data), salt: enc.iv }
}
