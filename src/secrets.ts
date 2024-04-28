import * as db from './db'
import * as env from './lib/env'
import { decodeJson, encodeJson } from './lib/json-base64'
import { randomBase64 } from './lib/random-base64'

interface Secrets {
  startSecret: string
  chatSecret: string
  nickPepper: string
  chatHashPepper: string
}

export const generate = (): Secrets => {
  const SECRET_BYTES = env.uint('CRYPTO_SECRET_BYTES', 32)
  const PEPPER_BYTES = env.uint('CRYPTO_PEPPER_BYTES', 32)

  return {
    startSecret: randomBase64(SECRET_BYTES),
    chatSecret: randomBase64(SECRET_BYTES),
    nickPepper: randomBase64(PEPPER_BYTES),
    chatHashPepper: randomBase64(PEPPER_BYTES),
  }
}

let secrets: Secrets | null = null

export const init = async () => {
  if (secrets) {
    throw new Error('Already initialized')
  }

  const encoded = await db.getSecrets()
  if (encoded) {
    secrets = decodeJson(encoded)
    return
  }

  secrets = generate()
  await db.setSecrets(encodeJson(secrets))
}

export const get = <K extends keyof Secrets>(key: K): Secrets[K] => {
  if (!secrets) {
    throw new Error('Secrets not initialized')
  }
  if (!(key in secrets) || !secrets[key]) {
    throw new Error(`Secret ${key} not found`)
  }
  return String(secrets[key])
}
