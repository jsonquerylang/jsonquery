import {
  Evaluator,
  FunctionCompiler,
  JSONProperty,
  JSONPropertyGetter,
  JSONQuery,
  Operator
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions?: Record<string, FunctionCompiler>
): unknown {
  const compiled = compile(query, functions)

  return compiled(data)
}

export function compile(query: JSONQuery, functions?: Record<string, FunctionCompiler>): Evaluator {
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
    const [name, ...args] = query as unknown as [string, JSONQuery[]]
    const fn = functions?.[name] ?? coreFunctions[name]
    if (fn) {
      // special cases
      // FIXME: get rid of these special cases: let map and filter call compile themselves?
      if (fn === map || fn === filter) {
        const compiledArgs = args.map((arg) => compile(arg, functions))
        return fn(...compiledArgs)
      }

      return fn(...args)
    }

    // operator
    const [left, opName, ...right] = query as unknown as [JSONQuery, string, JSONQuery[]]
    const opArgs = [left, ...right]
    const opConstructor = operatorCompilers[opName]
    if (opConstructor) {
      return opConstructor(...opArgs)
    }
    const op = operators[opName]
    if (op) {
      // TODO: try to merge function and operator logic?
      const compiledArgs = opArgs.map((arg) => compile(arg, functions))
      return (data) => {
        const evaluatedArgs = compiledArgs.map((arg) => arg(data))
        return op(...evaluatedArgs)
      }
    }

    // pipe
    // @ts-ignore
    const pipe: Evaluator[] = query.map((item) => compile(item, functions))
    return (data) => pipe.reduce((data, evaluator) => evaluator(data), data)
  }

  // FIXME: only allow properties inside a function or operator, not at root level
  // property without brackets
  if (isString(query)) {
    return get(query)
  }

  // value
  return () => query
}

export const get =
  (...property: JSONProperty) =>
  (data: unknown) => {
    let value = data

    for (const prop of property) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  }

const createGetter = (property: JSONProperty | string): JSONPropertyGetter => {
  return isString(property) ? get(property) : get(...property)
}

export const string = (text: string) => () => text

export const map =
  <T, U>(callback: (item: T) => U) =>
  (data: T[]) =>
    data.map(callback)

export const filter =
  <T>(predicate: (item: T) => boolean) =>
  (data: T[]): T[] => {
    return data.filter(predicate)
  }

export const sort = <T>(property: JSONProperty | string = [], direction?: 'asc' | 'desc') => {
  const getter = createGetter(property)
  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: Record<string, T>, itemB: Record<string, T>) {
    const a = getter(itemA)
    const b = getter(itemB)
    return a > b ? sign : a < b ? -sign : 0
  }

  return (data: unknown[]) => data.slice().sort(getter ? compare : undefined)
}

export const pick = (...properties: Array<JSONProperty | string>) => {
  const getters: Array<[key: string, getter: JSONPropertyGetter]> = properties.map((property) => [
    isString(property) ? property : property[property.length - 1],
    createGetter(property)
  ])

  return (data: Record<string, unknown>): unknown => {
    if (isArray(data)) {
      return data.map((item) => _pick(item as Record<string, unknown>, getters))
    }

    return _pick(data, getters)
  }
}

const _pick = (
  object: Record<string, unknown>,
  getters: Array<[key: string, getter: JSONPropertyGetter]>
): unknown => {
  const out = {}

  getters.forEach(([key, getter]) => {
    out[key] = getter(object)
  })

  return out
}

export const groupBy = <T>(property: JSONProperty | string) => {
  const getter = createGetter(property)

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

export const keyBy = <T>(property: JSONProperty | string) => {
  const getter = createGetter(property)

  return (data: T[]) => {
    const res = {}

    data.forEach((item) => {
      const value = getter(item) as string
      res[value] = item
    })

    return res
  }
}

export const flatten = () => (data: unknown[]) => data.flat()

export const uniq =
  () =>
  <T>(data: T[]) => [...new Set(data)]

export const uniqBy =
  <T>(property: JSONProperty | string) =>
  (data: T[]): T[] =>
    Object.values(groupBy(property)(data)).map((groups) => groups[0])

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
  string,
  sort,
  map,
  filter,
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

const operatorCompilers: Record<string, FunctionCompiler> = {
  regex: (property: string, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = get(property)
    return (data: unknown) => {
      return regex.test(getter(data) as string)
    }
  }
}

const operators: Record<string, Operator> = {
  '==': (a, b) => a == b,
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  in: (a, ...b) => b.includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a != b,
  'not in': (a, ...b) => !b.includes(a),
  and: (a, b) => a && b,
  or: (a, b) => a || b,

  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b
}

const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

const isObject = (value: unknown): value is object =>
  value && typeof value === 'object' && !isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'
