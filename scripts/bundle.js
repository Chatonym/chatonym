#!/usr/bin/env node

const { resolve } = require('path')

const { nodeExternalsPlugin } = require('esbuild-node-externals')
const esbuild = require('esbuild')

const ROOT = resolve(__dirname, '..')

exports.bundle = async () => {
	await esbuild.build({
		entryPoints: [resolve(ROOT, 'src', 'main.ts')],
		outfile: resolve(ROOT, 'bin', 'chatonym.js'),

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
}

if (require.main === module) {
	exports.bundle().catch((err) => {
		console.error(err)
		process.exit(1)
	})
}
