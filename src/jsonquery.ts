import {
  JSONQueryOperatorImplementation,
  JSONPath,
  JSONPrimitive,
  JSONQuery,
  JSONQueryOperatorName,
  JSONQueryFunction,
  JSONQueryFunctionImplementation,
  JSONQueryOperator
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions?: Record<string, JSONQueryFunctionImplementation>
): unknown {
  if (isJSONQueryOperator(query, coreOperations)) {
    const [left, op, right] = query
    const leftValue = jsonquery(data, left as JSONQuery, functions) // FIXME: cleanup casting
    const rightValue = isArray(right) ? jsonquery(data, right, functions) : right
    return coreOperations[op](leftValue, rightValue)
  }

  if (isJSONQueryFunction(query, { ...coreFunctions, ...functions })) {
    const [name, ...args] = query

    // special case: function 'map'
    if (name === 'map') {
      return (data as unknown[]).map((item) => jsonquery(item, args[0] as JSONQuery, functions))
    }

    // special case: function 'concat'
    if (name === 'concat') {
      return [].concat(...args.map((arg) => jsonquery(data, arg as JSONQuery, functions)))
    }

    const fn = functions?.[name] || coreFunctions[name]
    if (!fn) {
      throw new Error(`Unknown query function "${name}"`)
    }
    return fn(data, ...args)
  }

  // pipeline
  if (isArray(query) && (query.length === 0 || isArray(query[0]))) {
    return query.reduce((data, item) => jsonquery(data, item, functions), data)
  }

  if (query && typeof query === 'object') {
    const obj = {}
    keys(query).forEach((key) => (obj[key] = jsonquery(data, query[key], functions)))
    return obj
  }

  // JSONPath
  if (
    (isArray(query) && query.every((path) => typeof path === 'string')) ||
    typeof query === 'string'
  ) {
    return get(data, query)
  }

  // value
  return query
}

export function get(data: unknown, path: string | JSONPath): unknown {
  if (isArray(data)) {
    return data.map((item) => get(item, path))
  }

  if (isArray(path)) {
    let value: unknown = data

    for (const prop of path) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  } else {
    return data != undefined ? data[path] : undefined
  }
}

export function filter<T>(
  data: T[],
  path: string | JSONPath,
  op: JSONQueryOperatorName,
  value: JSONPrimitive,
  regexOptions?: string
): T[] {
  // FIXME: implement support for evaluating a pipeline with multiple conditions
  const filterFn = coreOperations[op]
  if (!filterFn) {
    throw new SyntaxError(`Unknown filter operator "${op}"`)
  }

  const _value = op === 'regex' ? new RegExp(value as string, regexOptions) : value

  return data.filter((item) => filterFn(get(item, path), _value))
}

export function sort<T>(
  data: Record<string, T>[],
  path: string | JSONPath = [],
  direction?: 'asc' | 'desc'
): Record<string, T>[] {
  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: Record<string, T>, itemB: Record<string, T>) {
    const a = get(itemA, path)
    const b = get(itemB, path)
    return a > b ? sign : a < b ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick(data: unknown, ...paths: JSONPath[]): unknown {
  if (isArray(data)) {
    return data.map((item) => pick(item, ...paths))
  }

  const out = {}
  paths.forEach((path) => {
    const outKey: string = isArray(path) ? path[path.length - 1] : path
    out[outKey] = get(data, path)
  })
  return out
}

export function groupBy<T>(data: T[], key: string): Record<string, T[]> {
  const res = {}

  data.forEach((item) => {
    const value = item[key]
    if (res[value]) {
      res[value].push(item)
    } else {
      res[value] = [item]
    }
  })

  return res
}

export function keyBy<T>(data: T[], key: string): Record<string, T[]> {
  const res = {}

  data.forEach((item) => {
    const value = item[key]
    res[value] = item
  })

  return res
}

// FIXME: test function value
export const value = (_data: unknown, value: unknown): unknown => value

export const flatten = (data: unknown[]) => data.flat()

export const uniq = <T>(data: T[]) => [...new Set(data)]

export const uniqBy = <T>(data: T[], key: string): T[] =>
  values(groupBy(data, key)).map((groups) => groups[0])

export const limit = <T>(data: T[], count: number) => data.slice(0, count)

export const keys = Object.keys

export const values = Object.values

export const prod = (data: number[]) => data.reduce((a, b) => a * b)

export const sum = (data: number[]) => data.reduce((a, b) => a + b)

export const average = (data: number[]) => sum(data) / data.length

export const min = (data: number[]) => Math.min(...data)

export const max = (data: number[]) => Math.max(...data)

export function round(data: number | number[], digits = 0) {
  if (isArray(data)) {
    return data.map((item) => round(item, digits))
  }

  // @ts-ignore
  const num = Math.round(data + 'e' + digits)
  return Number(num + 'e' + -digits)
}

export const size = <T>(data: T[]) => data.length

const coreFunctions: Record<string, JSONQueryFunctionImplementation> = {
  get,
  value,
  filter,
  sort,
  pick,
  groupBy,
  keyBy,
  keys,
  values,
  flatten,
  uniq,
  uniqBy,
  limit,
  size,
  sum,
  min,
  max,
  prod,
  average,
  round
}

// TODO: make the coreOperations extendable, like with functions
const coreOperations: Record<string, JSONQueryOperatorImplementation> = {
  '==': (a, b) => a == b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, b) => (b as Array<unknown>).includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a != b,
  'not in': (a, b) => !(b as Array<unknown>).includes(a),
  and: (a, b) => !!a && !!b, // TODO: test operator and
  or: (a, b) => !!a || !!b, // TODO: test operator or
  regex: (a: string, regex: RegExp) => regex.test(a)
}

function isJSONQueryFunction(
  query: JSONQuery,
  functions: Record<string, JSONQueryFunctionImplementation>
): query is JSONQueryFunction {
  return isArray(query) && typeof query[0] === 'string'
  // return isArray(query) && Object.keys(functions).includes(query[0] as string) // FIXME
}

function isJSONQueryOperator(
  query: JSONQuery,
  operators: Record<
    JSONQueryOperatorName,
    (left: JSONQuery, op: JSONQueryOperatorName, right: JSONQuery) => unknown
  >
): query is JSONQueryOperator {
  return isArray(query) && query.length === 3 && Object.keys(operators).includes(query[1] as string)
}

const isArray = Array.isArray
