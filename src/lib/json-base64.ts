export const encodeJson = (secrets: any) => {
  const json = JSON.stringify(secrets)
  return Buffer.from(json).toString('base64url')
}

export const decodeJson = <T>(encrypted: string) => {
  const json = Buffer.from(encrypted, 'base64url').toString()
  return JSON.parse(json) as T
}
