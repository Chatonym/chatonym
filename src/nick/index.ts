import { type ChatInfo } from '../crypto/chat-token'
import { bufferToUInt64Array } from '../lib/buffer-to-uint64-array'
import * as env from '../lib/env'
import { hashNBytes } from '../lib/hash-n-bytes'
import * as secrets from '../secrets'
import prefixes from './prefixes.json'
import suffixes from './suffixes.json'

const PREFIXES_LEN = BigInt(prefixes.length)
const SUFFIXES_LEN = BigInt(suffixes.length)
const MAX_BASE32_HASH = 0x10000n

const WANTED_HASH_BYTES = 24
const WANTED_HASH_PARTS = Math.floor(WANTED_HASH_BYTES / 8)

const getHashAlgorithm = () => env.str('CRYPTO_HASH_ALGORITHM', 'sha256')

export const getPrefix = (n: bigint) => {
  const idx = Number(n % PREFIXES_LEN)
  return prefixes[idx] || prefixes[0]
}

export const getSuffix = (n: bigint) => {
  const idx = Number(n % SUFFIXES_LEN)
  return suffixes[idx] || suffixes[0]
}

export const getBase32Hash = (n: bigint) => {
  return (n % MAX_BASE32_HASH).toString(32).toUpperCase()
}

export const getNick = (input: string) => {
  const hash = hashNBytes(getHashAlgorithm(), input, WANTED_HASH_BYTES)

  const [n1, n2, n3] = bufferToUInt64Array(hash, WANTED_HASH_PARTS)
  return getPrefix(n1) + getSuffix(n2) + '#' + getBase32Hash(n3)
}

export const getNickForSender = (chat: ChatInfo) => {
  const pepper = secrets.get('nickPepper')
  const nickSeed = `${pepper}${chat.senderId}${chat.recipientId}${chat.seed}`
  return getNick(nickSeed)
}

export const getNickForRecipient = (chat: ChatInfo) => {
  return getNickForSender({
    senderId: chat.recipientId,
    recipientId: chat.senderId,
    seed: chat.seed,
  })
}
