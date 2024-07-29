import {
  JSONQueryOperatorImplementation,
  JSONPath,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryFunctionImplementation,
  JSONFilterCondition,
  JSONProperty
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions?: Record<string, JSONQueryFunctionImplementation>
): unknown {
  if (isJSONQueryFunction(query)) {
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

  if (isArray(query)) {
    return query.reduce((data, item) => jsonquery(data, item, functions), data)
  }

  if (query && typeof query === 'object') {
    const obj = {}
    keys(query).forEach((key) => (obj[key] = jsonquery(data, query[key], functions)))
    return obj
  }

  throw new Error('Unknown type of query')
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

export function filter<T>(data: T[], ...condition: JSONFilterCondition): T[] {
  return data.filter(createPredicate(condition))
}

function createPredicate<T>(
  condition: JSONFilterCondition | JSONFilterCondition[]
): (item: T) => unknown {
  if (condition.length === 1) {
    return createPredicate(condition[0])
  }

  const [left, op, right, ...rest] = condition as
    | [unknown, string, unknown]
    | [unknown, string, unknown, unknown[]]

  // TODO: try to simplify the following heuristics. Or at least write out the rules here in a comment

  const filterFn = operators[op]
  if (!filterFn) {
    throw new SyntaxError(`Unknown filter operator "${op}"`)
  }

  const leftPredicate = isFilterCondition(left)
    ? createPredicate(left)
    : isArray(left) ||
        (typeof left === 'string' && (!isArray(right) || op === 'in' || op === 'not in'))
      ? (item: T) => get(item, left)
      : () => left

  const rightPredicate = isFilterCondition(right)
    ? createPredicate([right, ...(rest as JSONFilterCondition[])])
    : op === 'in' || op === 'not in'
      ? () => right
      : isJSONProperty(right) && (!isJSONProperty(left) || isArray(right))
        ? (item: T) => get(item, right)
        : op === 'regex'
          ? () => new RegExp(right as string, (rest as string[])[0])
          : () => right

  // TODO: cleanup
  // console.log('predicate', condition, {
  //   left: leftPredicate.toString(),
  //   right: rightPredicate.toString(),
  //   filterFn: filterFn.toString()
  // })

  return (item: T) => {
    // TODO: cleanup
    // console.log('item', item, {
    //   left: leftPredicate(item),
    //   right: rightPredicate(item),
    //   result: filterFn(leftPredicate(item), rightPredicate(item))
    // })
    return filterFn(leftPredicate(item), rightPredicate(item))
  }
}

function isFilterCondition(condition: unknown): condition is JSONFilterCondition {
  return condition && condition[1] in operators
}

function isJSONProperty(value: unknown): value is JSONProperty {
  return isArray(value) || typeof value === 'string'
}

const operators: Record<string, JSONQueryOperatorImplementation> = {
  '==': (a, b) => a == b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, b) => (b as Array<unknown>).includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a != b,
  'not in': (a, b) => !(b as Array<unknown>).includes(a),
  and: (a, b) => (a as boolean) && (b as boolean),
  or: (a, b) => (a as boolean) || (b as boolean),
  regex: (a: string, regex: RegExp) => regex.test(a)
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

function isJSONQueryFunction(query: JSONQuery): query is JSONQueryFunction {
  return isArray(query) && typeof query[0] === 'string'
}

const isArray = Array.isArray
