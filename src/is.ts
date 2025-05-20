export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object' && value.constructor === Object

export const isString = (value: unknown): value is string => typeof value === 'string'

// source: https://stackoverflow.com/a/77278013/1262753
export const isEqual = <T>(a: T, b: T): boolean => {
  const _a = getValueOf(a)
  const _b = getValueOf(b)

  if (_a === _b) {
    return true
  }

  const bothObject = (isObject(_a) || isArray(_a)) && (isObject(_b) || isArray(_b))

  return (
    bothObject &&
    Object.keys(_a).length === Object.keys(_b).length &&
    Object.entries(_a).every(([k, v]) => isEqual(v, _b[k]))
  )
}

export const typeOf = (value: unknown): string => typeof getValueOf(value)

export const getValueOf = (value: unknown): unknown => (value ? value.valueOf() : value)
