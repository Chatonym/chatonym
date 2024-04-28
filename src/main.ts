import 'dotenv/config'

import { Telegraf } from 'telegraf'

import * as handlers from './handlers'
import * as env from './lib/env'
import { logError, logger } from './logger'
import * as secrets from './secrets'

export const main = async () => {
  logger.info('Starting bot')

  const BOT_TOKEN = env.popStr('BOT_TOKEN')
  const bot = new Telegraf(BOT_TOKEN)

  await secrets.init()
  handlers.init(bot)

  const promise = bot.launch()

  process.once('SIGINT', () => {
    logger.info('SIGINT received')
    bot.stop('SIGINT')
  })

  process.once('SIGTERM', () => {
    logger.info('SIGTERM received')
    bot.stop('SIGTERM')
  })

  return promise
}

if (require.main === module) {
  main().then(
    () => process.exit(),
    (err) => {
      logError(err)
      process.exit(1)
    },
  )
}
