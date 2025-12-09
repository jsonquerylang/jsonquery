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

export const getSafeProperty = (object: unknown, prop: string | number): unknown => {
  const value = object?.[prop]
  if (value === undefined) {
    return undefined
  }

  // 1. do not allow getting props from the prototype (can be unsafe, like .constructor)
  // 2. in case of an array, test if prop is an int
  // 3. do not allow getting props from a string or number for example
  if (
    !Object.hasOwn(object as object, prop) ||
    (Array.isArray(object) && !/^\d+$/.test(prop as string)) ||
    typeof object !== 'object'
  ) {
    throw new TypeError(`Unsupported property "${prop}"`)
  }

  return value
}
