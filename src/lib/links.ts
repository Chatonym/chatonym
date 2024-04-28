export const T_DOT_ME = 'https://t.me'

export const createBotLink = (botname: string, query: Record<string, any>) => {
  const url = new URL(botname, T_DOT_ME)

  for (const [k, v] of Object.entries(query)) {
    url.searchParams.append(k, v)
  }

  return url.toString()
}

export const createStartLink = (botname: string, token: string) => {
  return createBotLink(botname, { start: token })
}

export const createReplyLink = (botname: string, token: string) => {
  return createBotLink(botname, { reply: token })
}

export const parseChatToken = (botname: string, replyLink: string) => {
  const url = new URL(replyLink)

  if (url.origin !== T_DOT_ME || url.pathname !== `/${botname}`) {
    return null
  }

  return url.searchParams.get('reply')
}
