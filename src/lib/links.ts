export const T_DOT_ME = 'https://t.me'

export const START_TOKEN_QUERY_PARAM = 'start'
export const CHAT_TOKEN_QUERY_PARAM = 'chat'

export const createBotLink = (botname: string, query: Record<string, any>) => {
  const url = new URL(botname, T_DOT_ME)
  Object.entries(query).forEach(([k, v]) => url.searchParams.set(k, v))
  return String(url)
}

export const createStartLink = (botname: string, startToken: string) => {
  return createBotLink(botname, { [START_TOKEN_QUERY_PARAM]: startToken })
}

export const createChatLink = (botname: string, chatToken: string) => {
  return createBotLink(botname, { [CHAT_TOKEN_QUERY_PARAM]: chatToken })
}

export const tryCreatingUrl = (url: string) => {
  try {
    return new URL(url)
  } catch {
    return null
  }
}

export const parseChatToken = (botname: string, chatLink: string) => {
  const url = tryCreatingUrl(chatLink)

  if (
    !url ||
    url.protocol !== 'https:' ||
    url.origin !== T_DOT_ME ||
    url.pathname !== `/${botname}`
  ) {
    return null
  }

  return url.searchParams.get(CHAT_TOKEN_QUERY_PARAM)
}
