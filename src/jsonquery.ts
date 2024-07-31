import {
  Evaluator,
  FunctionCompiler,
  JSONPrimitive,
  JSONProperty,
  JSONQuery,
  Operator
} from './types'

export function jsonquery(
  data: unknown,
  query: JSONQuery | JSONQuery[],
  functions?: Record<string, FunctionCompiler>
): unknown {
  const compiled = compile(query, functions)

  return typeof compiled === 'function' ? compiled(data) : compiled
}

export function compile(
  query: JSONQuery | JSONQuery[],
  functions?: Record<string, FunctionCompiler>
): Evaluator {
  // console.log('compile', query) // FIXME: cleanup

  // object
  if (isObject(query)) {
    type Getter = [string, Evaluator]

    const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key], functions)])

    return (data) => {
      const obj = {}
      getters.forEach(
        ([key, getter]) => (obj[key] = typeof getter === 'function' ? getter(data) : getter)
      )
      return obj
    }
  }

  if (isArray(query)) {
    // function
    const [name, ...args] = query
    const fn = functions?.[name as string] ?? coreFunctions[name as string]
    if (fn) {
      // special cases: functions "get" and "string"
      // FIXME: get rid of these special cases
      if (fn === get || fn === string || fn === sort) {
        return fn(...args)
      }

      const compiledArgs = args.map((arg) => compile(arg as JSONQuery, functions))
      return fn(...compiledArgs)
    }

    // operator
    const [left, opName, ...right] = query
    const opArgs = [left, ...right]
    const opConstructor = operatorCompilers[opName as string]
    if (opConstructor) {
      return opConstructor(...opArgs)
    }
    const op = operators[opName as string]
    if (op) {
      // TODO: try to merge function and operator logic?
      const compiledArgs = opArgs.map((arg) => compile(arg as JSONQuery, functions))
      return (data) => {
        const evaluatedArgs = compiledArgs.map((arg) =>
          typeof arg === 'function' ? arg(data) : arg
        ) as []
        return op(...evaluatedArgs)
      }
    }

    // property
    // @ts-ignore
    if (query.length > 0 && query.every(isString)) {
      return get(...query)
    }

    // pipe
    // @ts-ignore
    const pipe: Evaluator[] = query.map((item: JSONQuery) => compile(item, functions))
    return (data) =>
      pipe.reduce(
        (data: unknown, evaluator: Evaluator) =>
          typeof evaluator === 'function' ? evaluator(data) : evaluator,
        data
      )
  }

  // property without brackets
  if (isString(query)) {
    return get(query)
  }

  // value
  // FIXME: return should a getter for the value, and remove the checks on whether to evaluate or not
  // @ts-ignore
  return query as JSONPrimitive
}

export const get = (...property: JSONProperty) => {
  const getter = (data: unknown) => {
    let value = data

    for (const prop of property) {
      value = value != undefined ? value[prop] : undefined
    }

    return value
  }

  // TODO: this is ugly
  getter.property = property

  return getter
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

export const sort = <T>(property: JSONProperty = [], direction?: 'asc' | 'desc') => {
  const sign = direction === 'desc' ? -1 : 1

  // FIXME: simplify this
  const getter = isString(property) ? get(property) : get(...property)

  function compare(itemA: Record<string, T>, itemB: Record<string, T>) {
    const a = getter(itemA)
    const b = getter(itemB)
    return a > b ? sign : a < b ? -sign : 0
  }

  return (data: unknown[]) => data.slice().sort(getter ? compare : undefined)
}

export const pick =
  (...getters: Array<(item: unknown) => unknown>) =>
  (data: Record<string, unknown>): unknown => {
    if (isArray(data)) {
      return data.map((item) => _pick(item as Record<string, unknown>, getters))
    }

    return _pick(data, getters)
  }

const _pick = (
  object: Record<string, unknown>,
  getters: Array<(item: unknown) => unknown>
): unknown => {
  const out = {}

  getters.forEach((getter) => {
    // @ts-ignore
    const property = getter.property as JSONProperty // FIXME: this is ugly!
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
  in: (a, ...b) => (b as Array<unknown>).includes(a),
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a != b,
  'not in': (a, ...b) => !(b as Array<unknown>).includes(a),
  and: (a, b) => (a as boolean) && (b as boolean),
  or: (a, b) => (a as boolean) || (b as boolean),

  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b
}

const isArray = <T>(value: unknown): value is T[] => Array.isArray(value)

const isObject = (value: unknown): value is object =>
  value && typeof value === 'object' && !isArray(value)

const isString = (value: unknown): value is string => typeof value === 'string'
