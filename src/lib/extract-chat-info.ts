import * as chatInfoCrypto from '../crypto/chat-token'
import * as links from './links'
import * as tgUtils from './tg-utils'

export interface ExtractChatInfoArgs {
  botname: string
  message: tgUtils.OptionalContentedMessage
}

export const extractChatInfo = ({ botname, message }: ExtractChatInfoArgs) => {
  const dataUrl = tgUtils.parseDataUrl(message)
  if (!dataUrl) {
    return null
  }

  const encryptedChatInfo = links.parseChatToken(botname, dataUrl)
  if (!encryptedChatInfo) {
    return null
  }

  return chatInfoCrypto.decrypt(encryptedChatInfo)
}
