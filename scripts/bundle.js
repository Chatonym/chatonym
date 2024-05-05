#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-var-requires */
const { join } = require('path')
const { chmod } = require('fs/promises')

const { nodeExternalsPlugin } = require('esbuild-node-externals')
const esbuild = require('esbuild')
const noop = require('lodash/noop')

const markExecutable = async (filePath) => chmod(filePath, 0o755).catch(noop)

const bundle = async (root = join(__dirname, '..')) => {
	const outfile = join(root, 'bot.js')

	await esbuild.build({
		entryPoints: [join(root, 'src', 'main.ts')],
		outfile,

		minifyWhitespace: true,
		minifySyntax: true,
		minify: true,
		keepNames: true,
		bundle: true,

		platform: 'node',
		target: 'esnext',
		format: 'iife',

		external: [],

		legalComments: 'none',
		banner: {
			js: '#!/usr/bin/env node',
		},

		plugins: [
			nodeExternalsPlugin({
				optionalDependencies: false,
				devDependencies: false,
				peerDependencies: true,
				dependencies: true,
			}),
		],
	})

	await markExecutable(outfile)
}

exports.bundle = bundle

if (require.main === module) {
	bundle().catch((err) => {
		console.error(err)
		process.exit(1)
	})
}
