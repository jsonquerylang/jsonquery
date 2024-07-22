import {
  JSONPath,
  JSONPrimitive,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryFilterOperator,
  FilterOperations,
  JSONQueryItem
} from './types'

export const all = {
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
  functions: Record<string, JSONQueryFunction> = all
): unknown {
  if (isJSONQueryItem(query)) {
    const [name, ...args] = query

    // special case: function 'map'
    if (name === 'map') {
      return (data as unknown[]).map((item) => jsonquery(item, args[0] as JSONQuery, functions))
    }

    const fn = functions[name]
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

export function filter(
  data: unknown[],
  path: string | JSONPath,
  op: JSONQueryFilterOperator,
  value: JSONPrimitive
): unknown[] {
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

export function uniqBy(data: unknown[], key: string): unknown[] {
  return Object.values(groupBy(data, key)).map((groups) => groups[0])
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

function isJSONQueryItem(query: JSONQuery): query is JSONQueryItem {
  return Array.isArray(query) && typeof query[0] === 'string'
}
