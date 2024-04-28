import { randomInt } from 'crypto'

export const randomUInt32 = () => randomInt(0, 0x100000000)
