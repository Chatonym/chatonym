import { createSecretKey } from 'crypto'
import * as crypto from 'crypto'
import memoize from 'lodash/memoize'
import { LRUCache } from 'lru-cache'

import * as env from '../lib/env'
import * as secrets from '../secrets'
import * as base from './base'
import * as startToken from './start-token'

export type CacheKey = ReturnType<typeof cacheKey>

export interface ChatInfo extends startToken.StartToken {
  senderId: number
}

const CHAT_HASH_ALGORITHM = env.str('CRYPTO_HASH_ALGORITHM', 'sha256')

const CACHE = new LRUCache<CacheKey, string>({
  max: env.uint('CACHE_MAX', 10000),
  ttl: env.uint('CACHE_TTL', 14400),
})

export const cacheKey = (chat: ChatInfo) => {
  return [chat.senderId, chat.recipientId, chat.seed].join('#')
}

export const serialize = (chat: ChatInfo) => {
  const startTokenBuf = startToken.serialize(chat)

  if (!Number.isSafeInteger(chat.senderId)) {
    throw new TypeError('senderId must be a safe integer')
  }
  const senderIdBuf = Buffer.alloc(8)
  senderIdBuf.writeBigInt64BE(BigInt(chat.senderId), 0)

  return Buffer.concat([startTokenBuf, senderIdBuf])
}

export const deserialize = (buf: Buffer): ChatInfo => {
  if (buf.length !== 20) {
    throw new TypeError('Invalid buffer length')
  }

  const { recipientId, seed } = startToken.deserialize(buf)

  const senderId = Number(buf.readBigInt64BE(12))
  if (!Number.isSafeInteger(senderId)) {
    throw new TypeError('Unable to extract senderId from buffer')
  }

  return { recipientId, seed, senderId }
}

export const getChatSecretKey = memoize(() => {
  const str = secrets.get('chatSecret')
  return createSecretKey(Buffer.from(str, 'base64url'))
})

export const encrypt = (chat: ChatInfo) => {
  const key = cacheKey(chat)
  const cached = CACHE.get(key)
  if (cached) {
    return cached
  }

  const encrypted = base.encrypt(getChatSecretKey(), serialize(chat))
  if (encrypted) {
    CACHE.set(key, encrypted)
  }
  return encrypted
}

export const encryptRotated = (chat: ChatInfo) => {
  return encrypt({
    ...chat,
    recipientId: chat.senderId,
    senderId: chat.recipientId,
  })
}

export const decrypt = (chatToken: string): base.WithSalt<ChatInfo> | null => {
  const dec = base.decrypt(getChatSecretKey(), chatToken)

  if (!dec) {
    return null
  }

  return { ...deserialize(dec.data), salt: dec.iv }
}

/** @returns A consistent hash for the chat, regardless of the order of senderId and recipientId. */
export const chatHash = (chat: ChatInfo) => {
  const pepper = secrets.get('chatHashPepper')

  const user1Id = Math.min(chat.senderId, chat.recipientId)
  const user2Id = Math.max(chat.senderId, chat.recipientId)
  const str = `${pepper}${user1Id}${user2Id}${chat.seed}`

  return crypto.createHash(CHAT_HASH_ALGORITHM).update(str).digest('base64url')
}
