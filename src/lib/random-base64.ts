import * as crypto from 'crypto'

export const randomBase64 = (length: number) => {
  return crypto.randomBytes(length).toString('base64url')
}
