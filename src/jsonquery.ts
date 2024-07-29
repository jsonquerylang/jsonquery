import {
  JSONQueryOperatorImplementation,
  JSONQuery,
  JSONQueryFunctionImplementation,
  JSONFilterCondition,
  JSONProperty
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions?: Record<string, JSONQueryFunctionImplementation>
): unknown {
  // object
  if (isObject(query)) {
    const obj = {}
    keys(query).forEach((key) => (obj[key] = jsonquery(data, query[key], functions)))
    return obj
  }

  // function
  if (isArray(query)) {
    const [name, ...args] = query as [string, ...unknown[]]
    const fn = functions?.[name] || coreFunctions[name]

    // special case: function 'map'
    if (name === 'map') {
      // @ts-ignore
      return data.map((item: JSONQuery) =>
        // TODO: decide whether to support optional brackets for the arguments of functions map and filter
        // @ts-ignore
        jsonquery(item, args.length === 1 && isArray(args[0]) ? args[0] : args, functions)
      )
    }

    if (fn) {
      return fn(data, ...args)
    }
  }

  // property
  // @ts-ignore
  if (isArray(query) && query.every(isString)) {
    return get(data, query as string[])
  }

  // pipe
  if (isArray(query)) {
    // @ts-ignore
    return query.reduce((data: unknown, item: JSONQuery) => jsonquery(data, item, functions), data)
  }

  throw new Error(`Unknown type of query ${JSON.stringify(query)}`)
}

export function get(data: unknown, property: JSONProperty): unknown {
  if (isArray(property)) {
    let value: unknown = data

    for (const prop of property) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  } else {
    return data != undefined ? data[property] : undefined
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
    : isProperty(left)
      ? (item: T) => get(item, left)
      : () => left

  // FIXME: change "regex", "in", and "not in" into regular functions
  const rightPredicate = isFilterCondition(right)
    ? createPredicate([right, ...(rest as JSONFilterCondition[])])
    : op === 'regex'
      ? () => new RegExp(right as string, (rest as string[])[0])
      : isProperty(right) && op !== 'in' && op !== 'not in'
        ? (item: T) => get(item, right)
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
  property: JSONProperty = [],
  direction?: 'asc' | 'desc'
): Record<string, T>[] {
  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: Record<string, T>, itemB: Record<string, T>) {
    const a = get(itemA, property)
    const b = get(itemB, property)
    return a > b ? sign : a < b ? -sign : 0
  }

  return data.slice().sort(compare)
}

export function pick(object: Record<string, unknown>, ...properties: JSONProperty[]): unknown {
  const out = {}
  properties.forEach((properties) => {
    const outKey: string = isArray(properties) ? properties[properties.length - 1] : properties
    out[outKey] = get(object, properties)
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

export function round(data: number, digits = 0) {
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

const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

const isObject = (value: unknown): value is object =>
  value && typeof value === 'object' && !isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'

const isProperty = (value: unknown): value is JSONProperty => isArray(value)
