import { logger } from '../src/logger'

const ENV = process.env.NODE_ENV
const SHOULD_SILENT_LOGGER = ['test', undefined].includes(ENV)

export const mochaHooks = {
  beforeAll() {
    if (SHOULD_SILENT_LOGGER) {
      logger.transports.forEach((t) => (t.silent = true))
    }
  },
}
