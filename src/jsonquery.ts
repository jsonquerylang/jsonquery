import {
  JSONQuery,
  JSONFilterCondition,
  JSONProperty,
  FunctionCompiler,
  Evaluator,
  OperatorCompiler,
  JSONPrimitive
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery | JSONQuery[],
  functions?: Record<string, FunctionCompiler>
): unknown {
  return compile(query, { ...coreFunctions, ...functions })(data)
}

export function compile(
  query: JSONQuery | JSONQuery[],
  functions: Record<string, FunctionCompiler>
): Evaluator {
  console.log('compile', query) // FIXME: cleanup

  // object
  if (isObject(query)) {
    type Getter = [string, Evaluator]

    const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key], functions)])

    return (data) => {
      const obj = {}
      getters.forEach(([key, getter]) => (obj[key] = getter(data)))
      return obj
    }
  }

  if (isArray(query)) {
    // function
    const [name, ...args] = query
    const fn = functions[name as string]
    if (fn) {
      const compiledArgs = args.map((arg) => compile(arg as JSONQuery, functions))
      // return (data) => {
      //   const evaluatedArgs = compiledArgs.map((arg) => arg(data))
      //   console.log('evaluatedArgs', name, JSON.stringify(evaluatedArgs))
      //   return fn(...evaluatedArgs)
      // }

      // console.log('compiledArgs', name, compiledArgs)
      return fn(...compiledArgs)
    }

    // operator
    const [left, opName, ...right] = query
    const op = operators[opName as string]
    if (op) {
      // TODO: try to merge function and operator logic
      const args = [left, ...right]
      return op(...args.map((arg) => compile(arg as JSONQuery, functions)))
    }

    // property
    // @ts-ignore
    if (query.length > 0 && query.every(isString)) {
      return get(...query)
    }

    // pipe
    // @ts-ignore
    const pipe: Evaluator[] = query.map((item: JSONQuery) => compile(item, functions))
    return (data) => pipe.reduce((data: unknown, evaluator: Evaluator) => evaluator(data), data)
  }

  // value
  // console.log('compile value', JSON.stringify(query)) // FIXME: cleanup
  return query as JSONPrimitive
}

export const get = (...property: JSONProperty) => {
  const getter = (data: unknown) => {
    console.log('get', JSON.stringify(property))
    let value = data

    for (const prop of property) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  }

  getter.property = property

  return getter
}

export const map = (callback: Evaluator) => (data: unknown[]) => data.map(callback)

// FIXME: refactor function filter
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

const operators: Record<string, OperatorCompiler> = {
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

export const sort = <T>(
  getter: (item: Record<string, T>) => unknown = (item) => item,
  direction?: 'asc' | 'desc'
) => {
  console.log('sort', getter?.toString(), direction?.toString()) // FIXME: cleanup

  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: Record<string, T>, itemB: Record<string, T>) {
    const a = getter(itemA)
    const b = getter(itemB)
    return a > b ? sign : a < b ? -sign : 0
  }

  return (data: unknown[]) => data.slice().sort(getter ? compare : undefined)
}

export const pick =
  (...getters: Array<(item: unknown) => unknown>) =>
  (object: Record<string, unknown>): unknown => {
    const out = {}
    getters.forEach((getter) => {
      const property = getter.property as JSONProperty
      const outKey: string = property[property.length - 1]
      out[outKey] = getter(object)
    })
    return out
  }

export const groupBy =
  <T>(getter: (item: T) => unknown) =>
  (data: T[]) => {
    const res = {}

    for (const item of data) {
      const value = getter(item) as string | number
      if (res[value]) {
        res[value].push(item)
      } else {
        res[value] = [item]
      }
    }

    return res
  }

export const keyBy =
  <T>(getter: (item: T) => unknown) =>
  (data: T[]): Record<string, T[]> => {
    const res = {}

    data.forEach((item) => {
      const value = getter(item) as string
      res[value] = item
    })

    return res
  }

export const flatten = () => (data: unknown[]) => data.flat()

export const uniq =
  () =>
  <T>(data: T[]) => [...new Set(data)]

export const uniqBy =
  <T>(getter: (item: T) => unknown) =>
  (data: T[]): T[] =>
    Object.values(groupBy(getter)(data)).map((groups) => groups[0])

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
    // @ts-ignore
    const num = Math.round(data + 'e' + digits)
    return Number(num + 'e' + -digits)
  }

export const size =
  () =>
  <T>(data: T[]) =>
    data.length

const coreFunctions: Record<string, FunctionCompiler> = {
  get,
  sort,
  map,
  size,
  // FIXME
  // filter,
  pick,
  groupBy,
  keyBy,
  keys,
  values,
  flatten,
  uniq,
  uniqBy,
  limit,
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
