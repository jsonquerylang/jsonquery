import {
  JSONPath,
  JSONPrimitive,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryFilterOperator,
  FilterOperations,
  JSONQueryItem
} from './types'

const coreFunctions = {
  get,
  filter,
  sort,
  pick,
  groupBy,
  keyBy,
  flatten,
  uniq,
  uniqBy,
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
  functions?: Record<string, JSONQueryFunction>
): unknown {
  if (isJSONQueryItem(query)) {
    const [name, ...args] = query

    // special case: function 'map'
    if (name === 'map') {
      return (data as unknown[]).map((item) => jsonquery(item, args[0] as JSONQuery, functions))
    }

    const fn = functions?.[name] || coreFunctions[name]
    if (!fn) {
      throw new Error(`Unknown query function "${name}"`)
    }
    return fn(data, ...args)
  }

  if (Array.isArray(query)) {
    return query.reduce((data, item) => jsonquery(data, item, functions), data)
  }

  if (query && typeof query === 'object') {
    const obj = {}
    Object.keys(query).forEach((key) => (obj[key] = jsonquery(data, query[key], functions)))
    return obj
  }

  throw new Error('Unknown type of query')
}

export function get(data: unknown, path: string | JSONPath): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => get(item, path))
  }

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

export function filter<T>(
  data: T[],
  path: string | JSONPath,
  op: JSONQueryFilterOperator,
  value: JSONPrimitive
): T[] {
  const filterFn = filterOperations[op]
  if (!filterFn) {
    throw new SyntaxError(`Unknown filter operator "${op}"`)
  }

  const predicate = (item: unknown) => filterFn(get(item, path), value)
  return data.filter(predicate)
}

const filterOperations: FilterOperations = {
  '==': (a, b) => a === b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, b) => (b as Array<unknown>).includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b,
  'not in': (a, b) => !(b as Array<unknown>).includes(a)
}

export function sort<T>(
  data: Record<string, T>[],
  path: string | JSONPath = [],
  direction?: 'asc' | 'desc'
): Record<string, T>[] {
  const sign = direction === 'desc' ? -1 : 1
  const compare = (a: Record<string, T>, b: Record<string, T>) => {
    const aa = get(a, path)
    const bb = get(b, path)
    return aa > bb ? sign : aa < bb ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick(data: unknown, ...paths: JSONPath[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pick(item, ...paths))
  }

  const out = {}
  paths.forEach((path) => {
    const outKey: string = Array.isArray(path) ? path[path.length - 1] : path
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

export function flatten(data: unknown[]): unknown[] {
  return data.flat()
}

export function uniq<T>(data: T[]): T[] {
  return [...new Set(data)]
}

export function uniqBy<T>(data: T[], key: string): T[] {
  return Object.values(groupBy(data, key)).map((groups) => groups[0])
}

export function limit<T>(data: T[], count: number): T[] {
  return data.slice(0, count)
}

export function prod(data: number[]): number {
  return data.reduce((a, b) => a * b)
}

export function sum(data: number[]): number {
  return data.reduce((a, b) => a + b)
}

export function average(data: number[]): number {
  return sum(data) / data.length
}

export function min(data: number[]): number {
  return Math.min(...data)
}

export function max(data: number[]): unknown {
  return Math.max(...data)
}

export function size<T>(data: T[]): number {
  return data.length
}

function isJSONQueryItem(query: JSONQuery): query is JSONQueryItem {
  return Array.isArray(query) && typeof query[0] === 'string'
}
