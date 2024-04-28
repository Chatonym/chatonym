import 'winston-daily-rotate-file'
import { resolve } from 'path'

import { createLogger, format, transports } from 'winston'

import * as env from './lib/env'

const LOG_LEVEL_CONSOLE = env.str('LOG_LEVEL_CONSOLE', 'info')
const LOG_LEVEL_FILE = env.str('LOG_LEVEL_FILE', 'silent')
const LOG_FILE = env.str('LOG_FILE', resolve('combined-%DATE%.log')).trim()

export const formatForConsole = format.combine(
  format.timestamp(),
  format.colorize({ all: true }),
  format.printf((o) => `${o.timestamp} ${o.level}: ${o.stack || o.message}`),
)

export const formatForFile = format.combine(format.timestamp(), format.json())

export const chooseTransports = function* () {
  if (LOG_LEVEL_CONSOLE !== 'silent') {
    yield new transports.Console({
      level: LOG_LEVEL_CONSOLE,
      format: formatForConsole,
    })
  }

  if (LOG_LEVEL_FILE !== 'silent' && LOG_FILE) {
    yield new transports.DailyRotateFile({
      level: LOG_LEVEL_FILE,
      filename: LOG_FILE,
      format: formatForFile,
      datePattern: 'YYYY-MM-DD',
      maxFiles: '14d',
    })
  }
}

export const logger = createLogger({
  transports: [...chooseTransports()],
})
