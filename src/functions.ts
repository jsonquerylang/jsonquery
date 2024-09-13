import { Getter, JSONPath, JSONQueryProperty, JSONQuery, FunctionBuildersMap } from './types'
import { compile } from './compile'
import { isArray, isString } from './is'
import { buildFunction } from './buildFunction'

export const functions: FunctionBuildersMap = {
  get: (path: string | number | JSONPath = []) =>
    isArray(path)
      ? (data: unknown) => {
          let value = data

          for (const prop of path) {
            value = value?.[prop]
          }

          return value
        }
      : (data: unknown) => data?.[path],

  map: <T>(callback: JSONQuery) => {
    const _callback = compile(callback)
    return (data: T[]) => data.map(_callback)
  },

  filter: <T>(...predicate: JSONQuery[]) => {
    const _predicate = compile(predicate.length === 1 ? predicate[0] : predicate)
    return (data: T[]) => data.filter(_predicate)
  },

  sort: <T>(path: JSONQueryProperty = ['get'], direction?: 'asc' | 'desc') => {
    const getter = compile(path)
    const sign = direction === 'desc' ? -1 : 1

    function compare(itemA: unknown, itemB: unknown) {
      const a = getter(itemA)
      const b = getter(itemB)
      return a > b ? sign : a < b ? -sign : 0
    }

    return (data: T[]) => data.slice().sort(compare)
  },

  pick: (...properties: JSONQueryProperty[]) => {
    const getters: Getter[] = properties.map(([_get, path]) => [
      isString(path) ? path : path[path.length - 1],
      functions.get(path)
    ])

    const _pick = (object: Record<string, unknown>, getters: Getter[]): unknown => {
      const out = {}

      getters.forEach(([key, getter]) => {
        out[key] = getter(object)
      })

      return out
    }

    return (data: Record<string, unknown>): unknown => {
      if (isArray(data)) {
        return data.map((item: Record<string, unknown>) => _pick(item, getters))
      }

      return _pick(data, getters)
    }
  },

  groupBy: <T>(path: JSONQueryProperty) => {
    const getter = compile(path)

    return (data: T[]) => {
      const res = {}

      for (const item of data) {
        const value = getter(item) as string
        if (res[value]) {
          res[value].push(item)
        } else {
          res[value] = [item]
        }
      }

      return res
    }
  },

  keyBy: <T>(path: JSONQueryProperty) => {
    const getter = compile(path)

    return (data: T[]) => {
      const res = {}

      data.forEach((item) => {
        const value = getter(item) as string
        res[value] = res[value] ?? item
      })

      return res
    }
  },

  flatten: () => (data: unknown[]) => data.flat(),

  uniq:
    () =>
    <T>(data: T[]) => [...new Set(data)],

  uniqBy:
    <T>(path: JSONQueryProperty) =>
    (data: T[]): T[] =>
      Object.values(functions.groupBy(path)(data)).map((groups) => groups[0]),

  limit:
    (count: number) =>
    <T>(data: T[]) =>
      data.slice(0, count),

  size:
    () =>
    <T>(data: T[]) =>
      data.length,

  keys: () => Object.keys,

  values: () => Object.values,

  prod: () => (data: number[]) => data.reduce((a, b) => a * b),

  sum: () => (data: number[]) => data.reduce((a, b) => a + b),

  average: () => (data: number[]) => (functions.sum()(data) as number) / data.length,

  min: () => (data: number[]) => Math.min(...data),

  max: () => (data: number[]) => Math.max(...data),

  in: (path: string, values: string[]) => {
    const getter = compile(path)
    return (data: unknown) => values.includes(getter(data) as string)
  },

  'not in': (path: string, values: string[]) => {
    const getter = compile(path)
    return (data: unknown) => !values.includes(getter(data) as string)
  },

  regex: (path: JSONQuery, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = compile(path)
    return (data: unknown) => regex.test(getter(data) as string)
  },

  and: buildFunction((a, b) => a && b),
  or: buildFunction((a, b) => a || b),
  eq: buildFunction((a, b) => a === b),
  gt: buildFunction((a, b) => a > b),
  gte: buildFunction((a, b) => a >= b),
  lt: buildFunction((a, b) => a < b),
  lte: buildFunction((a, b) => a <= b),
  ne: buildFunction((a, b) => a !== b),

  not: buildFunction((value: unknown) => !value),
  exists: buildFunction((value: unknown) => value !== undefined),

  add: buildFunction((a: number, b: number) => a + b),
  subtract: buildFunction((a: number, b: number) => a - b),
  multiply: buildFunction((a: number, b: number) => a * b),
  divide: buildFunction((a: number, b: number) => a / b),
  pow: buildFunction((a: number, b: number) => a ** b),
  mod: buildFunction((a: number, b: number) => a % b),

  abs: buildFunction(Math.abs),
  round: buildFunction((value: number, digits = 0) => {
    const num = Math.round(Number(value + 'e' + digits))
    return Number(num + 'e' + -digits)
  })
}
