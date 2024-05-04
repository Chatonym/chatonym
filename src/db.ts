import initKnex from 'knex'
import memoize from 'lodash/memoize'
import { resolve } from 'path'

import * as env from './lib/env'
import { logError } from './logger'

type KnexConfig = initKnex.Knex.Config
type Knex = initKnex.Knex

export const prepareConnection = (con: any, done: () => void) => {
  con.pragma('foreign_keys = ON')
  done()
}

export const getKnexConfig = (): KnexConfig => ({
  client: 'better-sqlite3',
  connection: {
    filename: env.str('DB_FILE', resolve('chatonym.db')),
  },
  useNullAsDefault: true,
  pool: {
    afterCreate: prepareConnection,
  },
})

export const internalInit = async (createTables = true) => {
  const cachedKnex = initKnex(getKnexConfig())

  process.off('beforeExit', destroyKnex)
  process.once('beforeExit', destroyKnex)

  if (createTables) {
    await createTerminatedChatTable(cachedKnex)
    await createSecretsTable(cachedKnex)
  }

  return cachedKnex
}

export const init = memoize(internalInit)

export const destroyKnex = async () => {
  const cachedKnex: Knex | undefined = init.cache.get(undefined)
  init.cache.clear?.()

  if (!cachedKnex) {
    return
  }

  try {
    await cachedKnex?.destroy()
  } catch (err) {
    logError(err)
  }
}

export const TERMINATED_CHAT = 'terminatedChat'
export const SECRETS = 'secrets'

export const createTerminatedChatTable = async (knex?: Knex) => {
  knex ||= await init(false)

  if (await knex.schema.hasTable(TERMINATED_CHAT)) {
    return
  }

  await knex.schema.createTable(TERMINATED_CHAT, (tc) =>
    tc.string('chatHash').primary(),
  )
}

export const createSecretsTable = async (knex?: Knex) => {
  knex ||= await init(false)

  if (await knex.schema.hasTable(SECRETS)) {
    return
  }

  await knex.schema.createTable(SECRETS, (s) => s.string('secrets').primary())
}

export const terminate = async (chatHash: string, knex?: Knex) => {
  knex ||= await init()

  await knex(TERMINATED_CHAT).insert({ chatHash }).onConflict().ignore()
}

export const isTerminated = async (chatHash: string, knex?: Knex) => {
  knex ||= await init()

  const result = await knex(TERMINATED_CHAT)
    .select(1)
    .where({ chatHash })
    .limit(1)
  return result.length > 0
}

export const getSecrets = async (knex?: Knex) => {
  knex ||= await init()

  const results = await knex(SECRETS)
  if (!results.length) {
    return null
  }
  if (results.length > 1) {
    throw new Error('Multiple secrets found')
  }

  return String(results[0].secrets)
}

export const setSecrets = async (secrets: string, knex?: Knex) => {
  knex ||= await init()

  const alreadyExists = await knex(SECRETS).select(1).first()
  if (alreadyExists) {
    throw new Error('Secrets already exist')
  }

  await knex.transaction(async (trx) => {
    await trx(SECRETS).del()
    await trx(SECRETS).insert({ secrets })
  })
}
