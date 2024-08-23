import {
  Evaluator,
  FunctionsMap,
  Getter,
  JSONPath,
  JSONProperty,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryOperator,
  JSONQueryPipe,
  Operator
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  customFunctions?: FunctionsMap
): unknown {
  const compiled = compile(query, customFunctions)

  return compiled(data)
}

export function compile(query: JSONQuery, customFunctions?: FunctionsMap): Evaluator {
  try {
    functionsStack.unshift({
      ...(functionsStack[0] as object),
      ...(customFunctions as object | undefined)
    })

    return _compile(query)
  } finally {
    functionsStack.shift()
  }
}

function _compile(query: JSONQuery): Evaluator {
  // object
  if (isObject(query)) {
    return object(query as JSONQueryObject)
  }

  if (isArray(query)) {
    // function
    const [fnName, ...args] = query as unknown as JSONQueryFunction
    const fn = functionsStack[0][fnName]
    if (fn) {
      return fn(...args)
    }

    // operator
    const [left, opName, ...right] = query as unknown as JSONQueryOperator
    const op = coreOperators[opName]
    if (op) {
      return op(...[left, ...right])
    }
    const rawOp = rawOperators[opName]
    if (rawOp) {
      const _right = right[0]
      const a = compile(left)
      // Special rule: relational operators interpret a string on the right side as a text and not a path
      const b = relationalOperators[opName] && isString(_right) ? () => _right : compile(_right)
      return (data: unknown) => rawOp(a(data), b(data))
    }

    // pipe
    return pipe(query as JSONQueryPipe)
  }

  // property
  if (isString(query)) {
    return get(query)
  }

  // value
  return () => query
}

export const get = (path: JSONPath | JSONProperty) =>
  isArray(path)
    ? (data: unknown) => {
        let value = data

        for (const prop of path) {
          value = value?.[prop]
        }

        return value
      }
    : (data: unknown) => data?.[path]

export const string = (text: string) => () => text

export const map = <T>(callback: JSONQuery) => {
  const _callback = compile(callback)
  return (data: T[]) => data.map(_callback)
}

export const filter = <T>(predicate: JSONQuery) => {
  const _predicate = compile(predicate)
  return (data: T[]) => data.filter(_predicate)
}

export const pipe = (entries: JSONQuery[]) => {
  const _entries = entries.map(compile)
  return (data: unknown) => _entries.reduce((data, evaluator) => evaluator(data), data)
}

export const object = (query: JSONQueryObject) => {
  const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key])])

  return (data: unknown) => {
    const obj = {}
    getters.forEach(([key, getter]) => (obj[key] = getter(data)))
    return obj
  }
}

export const sort = <T>(path: JSONPath | JSONProperty = [], direction?: 'asc' | 'desc') => {
  const getter = get(path)
  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: unknown, itemB: unknown) {
    const a = getter(itemA)
    const b = getter(itemB)
    return a > b ? sign : a < b ? -sign : 0
  }

  return (data: T[]) => data.slice().sort(compare)
}

export const pick = (...paths: (JSONPath | JSONProperty)[]) => {
  const getters: Getter[] = paths.map((path) => [
    isString(path) ? path : path[path.length - 1],
    get(path)
  ])

  return (data: Record<string, unknown>): unknown => {
    if (isArray(data)) {
      return data.map((item: Record<string, unknown>) => _pick(item, getters))
    }

    return _pick(data, getters)
  }
}

const _pick = (object: Record<string, unknown>, getters: Getter[]): unknown => {
  const out = {}

  getters.forEach(([key, getter]) => {
    out[key] = getter(object)
  })

  return out
}

export const groupBy = <T>(path: JSONPath | JSONProperty) => {
  const getter = get(path)

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
}

export const keyBy = <T>(path: JSONPath | JSONProperty) => {
  const getter = get(path)

  return (data: T[]) => {
    const res = {}

    data.forEach((item) => {
      const value = getter(item) as string
      res[value] = res[value] ?? item
    })

    return res
  }
}

export const flatten = () => (data: unknown[]) => data.flat()

export const uniq =
  () =>
  <T>(data: T[]) => [...new Set(data)]

export const uniqBy =
  <T>(path: JSONPath | JSONProperty) =>
  (data: T[]): T[] =>
    Object.values(groupBy(path)(data)).map((groups) => groups[0])

export const limit =
  (count: number) =>
  <T>(data: T[]) =>
    data.slice(0, count)

export const keys = () => Object.keys

export const values = () => Object.values

export const prod = () => (data: number[]) => data.reduce((a, b) => a * b)

export const sum = () => (data: number[]) => data.reduce((a, b) => a + b)

export const average = () => (data: number[]) => sum()(data) / data.length

export const min = () => (data: number[]) => Math.min(...data)

export const max = () => (data: number[]) => Math.max(...data)

export const round =
  (digits = 0) =>
  (data: number) => {
    const num = Math.round(Number(data + 'e' + digits))
    return Number(num + 'e' + -digits)
  }

export const size =
  () =>
  <T>(data: T[]) =>
    data.length

const coreFunctions: FunctionsMap = {
  map,
  filter,
  get,
  string,
  sort,
  pick,
  groupBy,
  keyBy,
  keys,
  values,
  flatten,
  uniq,
  uniqBy,
  size,
  limit,
  sum,
  min,
  max,
  prod,
  average,
  round
}

const functionsStack: FunctionsMap[] = [coreFunctions]

const relationalOperators: Record<string, Operator> = {
  '==': (a, b) => a == b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a != b
}

const rawOperators: Record<string, Operator> = {
  ...relationalOperators,

  and: (a, b) => a && b,
  or: (a, b) => a || b,

  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b
}

const coreOperators: FunctionsMap = {
  in: (path: string, values: string[]) => {
    const getter = get(path)
    return (data: unknown) => values.includes(getter(data))
  },
  'not in': (path: string, values: string[]) => {
    const getter = get(path)
    return (data: unknown) => !values.includes(getter(data))
  },
  regex: (path: string, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = get(path)
    return (data: unknown) => regex.test(getter(data) as string)
  }
}

const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

const isObject = (value: unknown): value is object =>
  value && typeof value === 'object' && !isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'
