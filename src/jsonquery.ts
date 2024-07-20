import {
  JSONPrimitive,
  JSONQuery,
  JSONQueryArray,
  JSONQueryMatchOperator,
  JSONQueryOperation,
  MatchOperations
} from './types'

export const all = {
  match,
  sort,
  pick,
  limit
}

export function jsonquery(
  data: unknown[],
  query: JSONQuery,
  operations: Record<string, JSONQueryOperation> = all
): unknown {
  if (isJSONQueryArray(query)) {
    return query.reduce((data, item) => jsonquery(data, item, operations), data)
  }

  const [name, ...args] = query
  const operation = operations[name]
  if (!operation) {
    throw new Error(`Unknown query operation "${name}"`)
  }
  return operation(data, ...args)
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

  // TODO: support nested fields
  const predicate = (item: unknown) => matchFn(item[path], value)
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
  // TODO: support nested fields
  const sign = direction === 'desc' ? -1 : 1
  const compare = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const aa = a[path]
    const bb = b[path]
    return aa > bb ? sign : aa < bb ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick(data: unknown[], ...paths: string[]): unknown[] {
  return data.map((item) => {
    const out = {}
    // TODO: support nested fields
    paths.forEach((path) => (out[path] = item[path]))
    return out
  })
}

export function limit(data: unknown[], count: number): unknown[] {
  return data.slice(0, count)
}

function isJSONQueryArray(query: JSONQuery): query is JSONQueryArray {
  return query && Array.isArray(query[0])
}
