export type Throw = typeof THROW
export const THROW = Symbol('throw')

export const str = (key: string, defaultValue: string | Throw = THROW) => {
	const val = process.env[key]

	if (val !== undefined) {
		return val
	}

	if (defaultValue !== THROW) {
		return defaultValue
	}

	throw new Error(`Missing environment variable: ${key}`)
}

export const popStr = (key: string, defaultValue: string | Throw = THROW) => {
	const val = str(key, defaultValue)
	delete process.env[key]
	return val
}

export function uint(key: string, defaultValue: number | Throw = THROW) {
	const strDefault = defaultValue === THROW ? THROW : String(defaultValue)
	const num = Number(str(key, strDefault))

	if (!Number.isSafeInteger(num) || num < 0) {
		throw new Error(`Invalid non-negative int value for ${key}: ${num}`)
	}

	return num
}
