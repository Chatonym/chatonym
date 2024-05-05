#!/usr/bin/env node

const { copyFile, mkdtemp, mkdir, rmdir } = require('fs/promises')
const noop = require('lodash/noop')
const { join } = require('path')
const tar = require('tar')
const os = require('os')

const package = require('../package.json')
const { bundle } = require('./bundle')

const DEFAULT_ROOT_DIR = join(__dirname, '..')

const makeBuildDir = () => {
  const prefix = join(os.tmpdir(), `build-${package.name}-`)
  return mkdtemp(prefix)
}

const copyFiles = async ({ rootDir = DEFAULT_ROOT_DIR, buildDir }) => {
  const packageDir = join(buildDir, package.name)
  await mkdir(packageDir)

  const copy = (f1, f2) => copyFile(join(rootDir, f1), join(packageDir, f2))

  const files = ['package.json', 'package-lock.json', 'bot.js']
  const promises = files.map((f) => copy(f, f))

  promises.push(copy('.env.example', '.env'))

  await Promise.all(promises)
}

const pack = async ({ rootDir = DEFAULT_ROOT_DIR, buildDir }) => {
  await tar.create(
    {
      gzip: true,
      file: join(rootDir, `${package.name}.tar.gz`),
      cwd: buildDir,
    },
    [package.name],
  )
}

const build = async (rootDir = DEFAULT_ROOT_DIR) => {
  await bundle(rootDir)

  const buildDir = await makeBuildDir()
  await copyFiles({ rootDir, buildDir })
  await pack({ rootDir, buildDir })
  await rmdir(buildDir).catch(noop)
}

exports.makeBuildDir = makeBuildDir
exports.copyFiles = copyFiles
exports.pack = pack
exports.build = build

if (require.main === module) {
  build().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}
