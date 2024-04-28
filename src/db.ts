import initKnex from 'knex'
import memoize from 'lodash/memoize'
import { resolve } from 'path'

import * as env from './lib/env'
import { logError } from './logger'

type KnexConfig = initKnex.Knex.Config
type Knex = initKnex.Knex

export const KNEX_CONFIG: Readonly<KnexConfig> = {
  client: 'better-sqlite3',
  connection: {
    filename: env.str('DB_FILE', resolve('chatonym.db')),
  },
  useNullAsDefault: true,
  pool: {
    afterCreate(con: any, done: () => void) {
      con.pragma('foreign_keys = ON')
      done()
    },
  },
}

export const internalInit = async () => {
  const cachedKnex = initKnex(KNEX_CONFIG)

  await createTerminatedChatTable(cachedKnex)
  await createSecretsTable(cachedKnex)

  process.off('beforeExit', destroyKnex).once('beforeExist', destroyKnex)

  return cachedKnex
}

export const init = memoize(internalInit)

export const destroyKnex = async () => {
  const cachedKnex: Knex | undefined = init.cache.get(undefined)
  if (!cachedKnex) {
    return
  }

  try {
    await cachedKnex?.destroy()
  } catch (err) {
    logError(err)
  }
}

export const createTerminatedChatTable = async (knex?: Knex) => {
  knex ||= await init()

  if (await knex.schema.hasTable('terminatedChat')) {
    return
  }

  await knex.schema.createTable('terminatedChat', (tc) =>
    tc.string('chatHash').primary(),
  )
}

export const createSecretsTable = async (knex?: Knex) => {
  knex ||= await init()

  if (await knex.schema.hasTable('secrets')) {
    return
  }

  await knex.schema.createTable('secrets', (s) => s.string('secrets').primary())
}

export const terminate = async (chatHash: string, knex?: Knex) => {
  knex ||= await init()

  await knex('terminatedChat').insert({ chatHash }).onConflict().ignore()
}

export const isTerminated = async (chatHash: string, knex?: Knex) => {
  knex ||= await init()

  const result = await knex('terminatedChat')
    .select(1)
    .where({ chatHash })
    .limit(1)
  return result.length > 0
}

export const getSecrets = async (knex?: Knex) => {
  knex ||= await init()

  const res = await knex('secrets').first()
  return res?.secrets ? String(res.secrets) : null
}

export const setSecrets = async (secrets: string, knex?: Knex) => {
  knex ||= await init()

  const alreadyExists = await knex('secrets').select(1).first()
  if (alreadyExists) {
    throw new Error('Secrets already exist')
  }

  await knex.transaction(async (trx) => {
    await trx('secrets').del()
    await trx('secrets').insert({ secrets })
  })
}
