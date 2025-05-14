export const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

export const isObject = (value: unknown): value is object =>
  value !== null && typeof value === 'object' && !isArray(value)

export const isString = (value: unknown): value is string => typeof value === 'string'

// source: https://stackoverflow.com/a/77278013/1262753
export const isEqual = <T>(a: T, b: T): boolean => {
  if (a === b) {
    return true
  }

  const bothObject = a !== null && b !== null && typeof a === 'object' && typeof b === 'object'

  return (
    bothObject &&
    Object.keys(a).length === Object.keys(b).length &&
    Object.entries(a).every(([k, v]) => isEqual(v, b[k as keyof T]))
  )
}
