import {
  JSONPath,
  JSONPrimitive,
  JSONQuery,
  JSONQueryArray,
  JSONQueryFunction,
  JSONQueryMatchOperator,
  JSONQueryObject,
  MatchOperations
} from './types'

export const all = {
  get,
  match,
  sort,
  pick,
  groupBy,
  keyBy,
  flatten,
  uniq,
  size,
  min,
  max,
  sum,
  prod,
  average,
  limit
}

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions: Record<string, JSONQueryFunction> = all
): unknown {
  if (isJSONQueryArray(query)) {
    return query.reduce((data, item) => jsonquery(data, item, functions), data)
  }

  if (isJSONQueryObject(query)) {
    const obj = {}
    Object.keys(query).forEach((key) => (obj[key] = jsonquery(data, query[key], functions)))
    return obj
  }

  // we assume query is an JSONQueryItem
  const [name, ...args] = query
  if (name === 'map' && Array.isArray(data)) {
    return data.map((item) => jsonquery(item, args[0] as JSONQuery, functions))
  }
  const fn = functions[name]
  if (!fn) {
    throw new Error(`Unknown query function "${name}"`)
  }
  // @ts-ignore
  return fn(data, ...args)
}

export function get(data: unknown, path: string | JSONPath): unknown {
  if (Array.isArray(path)) {
    let value: unknown = data

    for (const prop of path) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  } else {
    return data != undefined ? data[path] : undefined
  }
}

export function match(
  data: unknown[],
  path: string | JSONPath,
  op: JSONQueryMatchOperator,
  value: JSONPrimitive
): unknown[] {
  const matchFn = matchOperations[op]
  if (!matchFn) {
    throw new SyntaxError(`Unknown match operator "${op}"`)
  }

  const predicate = (item: unknown) => matchFn(get(item, path), value)
  return data.filter(predicate)
}

const matchOperations: MatchOperations = {
  '==': (a, b) => a === b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, b) => (b as Array<unknown>).includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b,
  'not in': (a, b) => !(b as Array<unknown>).includes(a)
}

export function sort(
  data: unknown[],
  path: string | JSONPath = [],
  direction?: 'asc' | 'desc'
): unknown[] {
  const sign = direction === 'desc' ? -1 : 1
  const compare = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aa = get(a, path)
    const bb = get(b, path)
    return aa > bb ? sign : aa < bb ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick<T extends unknown[] | unknown>(data: T, ...paths: JSONPath[]): T {
  if (!Array.isArray(data)) {
    return pick([data], ...paths)[0]
  }

  if (paths.length === 1) {
    const path = paths[0]
    return data.map((item) => get(item, path)) as T
  }

  return data.map((item) => {
    const out = {}
    paths.forEach((path) => {
      const outKey: string = Array.isArray(path) ? path[path.length - 1] : path
      out[outKey] = get(item, path)
    })
    return out
  }) as T
}

export function groupBy(data: unknown[], key: string): Record<string, unknown[]> {
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

export function keyBy(data: unknown[], key: string): Record<string, unknown[]> {
  const res = {}

  data.forEach((item) => {
    const value = item[key]
    res[value] = item
  })

  return res
}

export function flatten(data: unknown[]): unknown[] {
  return data.flat()
}

export function uniq(data: unknown[]): unknown[] {
  return [...new Set(data)]
}

export function limit(data: unknown[], count: number): unknown[] {
  return data.slice(0, count)
}

export function prod(data: number[]): number {
  return data.reduce((a, b) => a * b)
}

export function sum(data: number[]): number {
  return data.reduce((a, b) => a + b)
}

export function average(data: number[]): unknown {
  return sum(data) / data.length
}

export function min(data: number[]): unknown {
  return Math.min(...data)
}

export function max(data: number[]): unknown {
  return Math.max(...data)
}

export function size(data: unknown[]): number {
  return data.length
}

function isJSONQueryArray(query: JSONQuery): query is JSONQueryArray {
  return query && Array.isArray(query[0])
}

function isJSONQueryObject(query: JSONQuery): query is JSONQueryObject {
  return typeof query === 'object' && query != null && !Array.isArray(query)
}
