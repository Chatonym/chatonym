export const START_TOKEN_QUERY_PARAM = 'start'
export const CHAT_TOKEN_QUERY_PARAM = 'chat'

type QuerystringLike = ConstructorParameters<typeof URLSearchParams>[0]

export const createBotLink = (
	botname: string,
	query: QuerystringLike = {}
) => {
	const baseUrl = `https://${botname}.t.me`
	const qs = new URLSearchParams(query)
	return `${baseUrl}?${qs}`
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
    url?.protocol !== 'https:' ||
    !url.searchParams.get(CHAT_TOKEN_QUERY_PARAM)
  ) {
    return null
  }

  const token = url.searchParams.get(CHAT_TOKEN_QUERY_PARAM)

  // t.me/{botname} style
  if (url.origin === 'https://t.me' && url.pathname === `/${botname}`) {
    return token
  }

  // {botname}.t.me style
  if (url.origin === `https://${botname}.t.me` && url.pathname === `/`) {
    return token
  }

  return null
}
