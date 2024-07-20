import {
  JSONPath,
  JSONPrimitive,
  JSONQuery,
  JSONQueryArray,
  JSONQueryMatchOperator,
  JSONQueryFunction,
  MatchOperations,
  JSONQueryObject
} from './types'

export const all = {
  get,
  match,
  sort,
  pick,
  uniq,
  size,
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

  const [name, ...args] = query
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
    let i = 0

    while (i < path.length) {
      value = value != undefined ? value[path[i]] : undefined

      i++
    }

    return value
  } else {
    return data != undefined ? data[path] : undefined
  }
}

export function match(
  data: unknown[],
  path: string,
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

export function sort(data: unknown[], path: string, direction?: 'asc' | 'desc'): unknown[] {
  const sign = direction === 'desc' ? -1 : 1
  const compare = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aa = get(a, path)
    const bb = get(b, path)
    return aa > bb ? sign : aa < bb ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick(data: unknown[], ...paths: string[]): unknown[] {
  if (paths.length === 1) {
    const path = paths[0]
    return data.map((item) => get(item, path))
  }

  return data.map((item) => {
    const out = {}
    paths.forEach((path) => {
      const outPath: string = Array.isArray(path) ? path[path.length - 1] : path
      out[outPath] = get(item, path)
    })
    return out
  })
}

export function uniq(data: unknown[]): unknown[] {
  return [...new Set(data)]
}

export function limit(data: unknown[], count: number): unknown[] {
  return data.slice(0, count)
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
