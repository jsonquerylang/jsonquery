import { compile } from './compile'
import { getSafeProperty, isArray, isEqual } from './is'
import type {
  Entry,
  FunctionBuilder,
  FunctionBuildersMap,
  Getter,
  JSONPath,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryProperty
} from './types'

export function buildFunction(fn: (...args: unknown[]) => unknown): FunctionBuilder {
  return (...args: JSONQuery[]) => {
    const compiledArgs = args.map((arg) => compile(arg))

    const arg0 = compiledArgs[0]
    const arg1 = compiledArgs[1]

    return compiledArgs.length === 1
      ? (data: unknown) => fn(arg0(data))
      : compiledArgs.length === 2
        ? (data: unknown) => fn(arg0(data), arg1(data))
        : (data: unknown) => fn(...compiledArgs.map((arg) => arg(data)))
  }
}

const sortableTypes = { boolean: 0, number: 1, string: 2 }
const otherTypes = 3

const gt = (a: unknown, b: unknown) =>
  typeof a === typeof b && (typeof a) in sortableTypes ? a > b : false

const gte = (a: unknown, b: unknown) => isEqual(a, b) || gt(a, b)

const lt = (a: unknown, b: unknown) =>
  typeof a === typeof b && (typeof a) in sortableTypes ? a < b : false

const lte = (a: unknown, b: unknown) => isEqual(a, b) || lt(a, b)

export const functions: FunctionBuildersMap = {
  pipe: (...entries: JSONQuery[]) => {
    const _entries = entries.map((entry) => compile(entry))

    return (data: unknown) => _entries.reduce((data, evaluator) => evaluator(data), data)
  },

  object: (query: JSONQueryObject) => {
    const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key])])

    return (data: unknown) => {
      const obj = {}
      for (const [key, getter] of getters) {
        obj[key] = getter(data)
      }
      return obj
    }
  },

  array: (...items: JSONQuery[]) => {
    const _items = items.map((entry: JSONQuery) => compile(entry))

    return (data: unknown) => _items.map((item) => item(data))
  },

  get: (...path: JSONPath) => {
    if (path.length === 0) {
      return (data: unknown) => data ?? null
    }

    if (path.length === 1) {
      const prop = path[0]
      return (data: unknown) => getSafeProperty(data, prop) ?? null
    }

    return (data: unknown) => {
      let value = data

      for (const prop of path) {
        value = getSafeProperty(value, prop)
      }

      return value ?? null
    }
  },

  map: <T>(callback: JSONQuery) => {
    const _callback = compile(callback)

    return (data: T[]) => data.map(_callback)
  },

  mapObject: <T, U>(callback: JSONQuery) => {
    const _callback = compile(callback)

    return (data: Record<string, T>) => {
      const output = {}
      for (const key of Object.keys(data)) {
        const updated = _callback({ key, value: data[key] }) as Entry<U>
        output[updated.key] = updated.value
      }
      return output
    }
  },

  mapKeys: <T>(callback: JSONQuery) => {
    const _callback = compile(callback)

    return (data: Record<string, T>) => {
      const output = {}
      for (const key of Object.keys(data)) {
        const updatedKey = _callback(key) as string
        output[updatedKey] = data[key]
      }
      return output
    }
  },

  mapValues: <T>(callback: JSONQuery) => {
    const _callback = compile(callback)

    return (data: Record<string, T>) => {
      const output = {}
      for (const key of Object.keys(data)) {
        output[key] = _callback(data[key])
      }
      return output
    }
  },

  filter: <T>(predicate: JSONQuery) => {
    const _predicate = compile(predicate)

    return (data: T[]) => data.filter((item) => truthy(_predicate(item)))
  },

  sort: <T>(path: JSONQueryProperty = ['get'], direction?: 'asc' | 'desc') => {
    const getter = compile(path)
    const sign = direction === 'desc' ? -1 : 1

    function compare(itemA: unknown, itemB: unknown) {
      const a = getter(itemA)
      const b = getter(itemB)

      // Order mixed types
      if (typeof a !== typeof b) {
        const aIndex = sortableTypes[typeof a] ?? otherTypes
        const bIndex = sortableTypes[typeof b] ?? otherTypes

        return aIndex > bIndex ? sign : aIndex < bIndex ? -sign : 0
      }

      // Order two numbers, two strings, or two booleans
      if ((typeof a) in sortableTypes) {
        return a > b ? sign : a < b ? -sign : 0
      }

      // Leave arrays, objects, and unknown types ordered as is
      return 0
    }

    return (data: T[]) => data.slice().sort(compare)
  },

  reverse:
    <T>() =>
    (data: T[]) =>
      data.toReversed(),

  pick: (...properties: JSONQueryProperty[]) => {
    const getters = properties.map(
      ([_get, ...path]) => [path[path.length - 1], functions.get(...path)] as Getter
    )

    const _pick = (object: Record<string, unknown>, getters: Getter[]): unknown => {
      const out = {}
      for (const [key, getter] of getters) {
        out[key] = getter(object)
      }
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

      for (const item of data) {
        const value = getter(item) as string
        if (!(value in res)) {
          res[value] = item
        }
      }

      return res
    }
  },

  flatten: () => (data: unknown[]) => data.flat(),

  join:
    <T>(separator = '') =>
    (data: T[]) =>
      data.join(separator),

  split: buildFunction((text: string, separator?: string) =>
    separator !== undefined ? text.split(separator) : text.trim().split(/\s+/)
  ),

  substring: buildFunction((text: string, start: number, end?: number) =>
    text.slice(Math.max(start, 0), end)
  ),

  uniq:
    () =>
    <T>(data: T[]) => {
      const res: T[] = []

      for (const item of data) {
        if (res.findIndex((resItem) => isEqual(resItem, item)) === -1) {
          res.push(item)
        }
      }

      return res
    },

  uniqBy:
    <T>(path: JSONQueryProperty) =>
    (data: T[]): T[] =>
      Object.values(functions.keyBy(path)(data)),

  limit:
    (count: number) =>
    <T>(data: T[]) =>
      data.slice(0, Math.max(count, 0)),

  size:
    () =>
    <T>(data: T[]) =>
      data.length,

  keys: () => Object.keys,
  values: () => Object.values,

  prod: () => (data: number[]) => reduce(data, (a, b) => a * b),

  sum: () => (data: number[]) =>
    isArray(data) ? data.reduce((a, b) => a + b, 0) : throwArrayExpected(),

  average: () => (data: number[]) =>
    isArray(data)
      ? data.length > 0
        ? data.reduce((a, b) => a + b) / data.length
        : null
      : throwArrayExpected(),

  min: () => (data: number[]) => reduce(data, (a, b) => Math.min(a, b)),
  max: () => (data: number[]) => reduce(data, (a, b) => Math.max(a, b)),

  and: buildFunction((...data: unknown[]) => reduce(data, (a, b) => !!(a && b))),
  or: buildFunction((...data: unknown[]) => reduce(data, (a, b) => !!(a || b))),
  not: buildFunction((a: unknown) => !a),

  exists: (queryGet: JSONQueryFunction) => {
    const parentPath = queryGet.slice(1)
    const key = parentPath.pop()
    const getter = functions.get(...parentPath)

    return (data: unknown) => {
      const parent = getter(data)
      return !!parent && Object.hasOwnProperty.call(parent, key)
    }
  },
  if: (condition: JSONQuery, valueIfTrue: JSONQuery, valueIfFalse: JSONQuery) => {
    const _condition = compile(condition)
    const _valueIfTrue = compile(valueIfTrue)
    const _valueIfFalse = compile(valueIfFalse)

    return (data: unknown) => (truthy(_condition(data)) ? _valueIfTrue(data) : _valueIfFalse(data))
  },
  in: (value: JSONQuery, values: JSONQuery) => {
    const getValue = compile(value)
    const getValues = compile(values)

    return (data: unknown) => {
      const _value = getValue(data)
      const _values = getValues(data) as unknown[]

      return _values.findIndex((item) => isEqual(item, _value)) !== -1
    }
  },
  'not in': (value: JSONQuery, values: JSONQuery) => {
    const _in = functions.in(value, values)

    return (data: unknown) => !_in(data)
  },
  regex: (path: JSONQuery, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = compile(path)

    return (data: unknown) => regex.test(getter(data) as string)
  },

  match: (path: JSONQuery, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = compile(path)

    return (data: unknown) => {
      const result = (getter(data) as string).match(regex)
      return result ? matchToJSON(result) : null
    }
  },

  matchAll: (path: JSONQuery, expression: string, options?: string) => {
    const regex = new RegExp(expression, `${options ?? ''}g`)
    const getter = compile(path)

    return (data: unknown) => Array.from((getter(data) as string).matchAll(regex)).map(matchToJSON)
  },

  eq: buildFunction(isEqual),
  gt: buildFunction(gt),
  gte: buildFunction(gte),
  lt: buildFunction(lt),
  lte: buildFunction(lte),
  ne: buildFunction((a, b) => !isEqual(a, b)),

  add: buildFunction((a: number, b: number) => a + b),
  subtract: buildFunction((a: number, b: number) => a - b),
  multiply: buildFunction((a: number, b: number) => a * b),
  divide: buildFunction((a: number, b: number) => a / b),
  mod: buildFunction((a: number, b: number) => a % b),
  pow: buildFunction((a: number, b: number) => a ** b),

  abs: buildFunction(Math.abs),
  round: buildFunction((value: number, digits = 0) => {
    const num = Math.round(Number(`${value}e${digits}`))
    return Number(`${num}e${-digits}`)
  }),

  number: buildFunction((text: string) => {
    const num = Number(text)
    return Number.isNaN(Number(text)) ? null : num
  }),
  string: buildFunction(String)
}

const truthy = (x: unknown) => x !== null && x !== 0 && x !== false

const reduce = <T>(data: T[], callback: (previousValue: T, currentValue: T) => T): T => {
  if (!isArray(data)) {
    throwArrayExpected()
  }

  if (data.length === 0) {
    return null
  }

  return data.reduce(callback)
}

const matchToJSON = (result: RegExpMatchArray) => {
  const [value, ...groups] = result
  const namedGroups = result.groups

  return groups.length
    ? namedGroups
      ? { value, groups, namedGroups }
      : { value, groups }
    : { value }
}

const throwArrayExpected = () => {
  throwTypeError('Array expected')
}

export const throwTypeError = (message: string) => {
  throw new TypeError(message)
}
