import { Context, Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import * as fmt from 'telegraf/format'

import * as chatTokenCrypto from './crypto/chat-token'
import * as startTokenCrypto from './crypto/start-token'
import * as db from './db'
import * as compose from './lib/compose'
import { extractChatInfo } from './lib/extract-chat-info'
import * as links from './lib/links'
import * as tgUtils from './lib/tg-utils'
import { logError } from './logger'
import { getNickForRecipient, getNickForSender } from './nick'

export const init = (bot: Telegraf) => {
  const help = async (ctx: Context) => {
    const resp = compose.helpResponse()
    await ctx.reply(resp.text, resp)
  }

  bot.help(help)

  bot.command('start', async (ctx) => {
    const [token] = ctx.args
    const botname = ctx.botInfo.username
    const senderId = ctx.from.id

    if (!token) {
      return help(ctx)
    }

    const startInfo = startTokenCrypto.decrypt(token)
    if (!startInfo || startInfo.recipientId === senderId) {
      return ctx.react(compose.react.shrug)
    }

    const senderChatInfo = { ...startInfo, senderId }
    const chatHash = chatTokenCrypto.chatHash(senderChatInfo)
    if (await db.isTerminated(chatHash)) {
      return ctx.react(compose.react.failed)
    }

    const encryptedChatToken = chatTokenCrypto.encrypt({
      ...startInfo,
      senderId,
    })
    if (!encryptedChatToken) {
      return ctx.react(compose.react.failed)
    }

    const recipientNick = getNickForRecipient(senderChatInfo)
    const replyLink = links.createChatLink(botname, encryptedChatToken)
    const replyHeader = compose.replyHeader({
      chatLink: replyLink,
      nickname: recipientNick,
    })

    await ctx.reply(replyHeader.text, {
      entities: replyHeader.entities,
      ...tgUtils.NO_LINK_PREVIEW,
    })
    await ctx.react(compose.react.done)
  })

  bot.command('link', async (ctx) => {
    const botname = ctx.botInfo.username
    const userId = ctx.from.id

    const token = startTokenCrypto.encrypt({ recipientId: userId })
    if (!token) {
      return ctx.react(compose.react.failed)
    }

    const startLink = links.createStartLink(botname, token)
    const resp = compose.linkResponse({ startLink })

    await ctx.reply(resp.text, resp)
  })

  bot.command('terminate', async (ctx) => {
    const [forever] = ctx.args
    const hasForever = forever?.toLowerCase?.() === 'forever'
    const isReply = tgUtils.isRepliedToBot(ctx)
    if (!hasForever || !isReply) {
      const resp = compose.terminateUsage()
      return ctx.reply(resp.text, resp)
    }

    const chatInfo = extractChatInfo({
      botname: ctx.botInfo.username,
      message: ctx.message.reply_to_message,
    })
    if (!chatInfo) {
      return ctx.react(compose.react.failed)
    }

    const chatHash = chatTokenCrypto.chatHash(chatInfo)
    await db.terminate(chatHash)

    await ctx.react(compose.react.done)
  })

  bot.on(message('reply_to_message'), async (ctx) => {
    if (!tgUtils.isRepliedToBot(ctx)) {
      return
    }

    const botname = ctx.botInfo.username

    const senderChatInfo = extractChatInfo({
      botname,
      message: ctx.message.reply_to_message,
    })
    if (!senderChatInfo) {
      return ctx.react(compose.react.failed)
    }

    const chatHash = chatTokenCrypto.chatHash(senderChatInfo)
    if (await db.isTerminated(chatHash)) {
      return ctx.react(compose.react.failed)
    }

    const theirChatInfo = chatTokenCrypto.encryptRotated(senderChatInfo)
    if (!theirChatInfo) {
      return ctx.react(compose.react.failed)
    }

    const newReplyLink = links.createChatLink(botname, theirChatInfo)
    const senderNick = getNickForSender(senderChatInfo)
    const header = compose.replyHeader({
      chatLink: newReplyLink,
      nickname: senderNick,
    })

    const msg = tgUtils.toFmtString(ctx.message)
    const resp = fmt.join([header, '\n\n', msg])
    const succeed = await tgUtils.resendMessage({
      ctx,
      recipientId: senderChatInfo.recipientId,
      response: resp,
    })

    await ctx.react(succeed ? compose.react.done : compose.react.failed)
  })

  bot.command('reactions', async (ctx) => {
    const resp = compose.reactionsResponse()
    await ctx.reply(resp.text, resp)
  })

  bot.command('faq', async (ctx) => {
    const resp = compose.faqResponse()
    await ctx.reply(resp.text, resp)
  })

  bot.command('privacy', async (ctx) => {
    const resp = compose.privacyResponse()
    await ctx.reply(resp.text, resp)
  })

  bot.command('disclaimer', async (ctx) => {
    const resp = compose.disclaimerResponse()
    await ctx.reply(resp.text, resp)
  })

  bot.on(message(), async (ctx) => {
    await ctx.react(compose.react.shrug)
  })

  bot.catch(async (err, ctx) => {
    logError(err)
    await ctx.react(compose.react.failed).catch(logError)
  })
}
