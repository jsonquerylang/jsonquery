export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

export const isObject = (value: unknown): value is object =>
  value && typeof value === 'object' && !isArray(value)

export const isString = (value: unknown): value is string => typeof value === 'string'
