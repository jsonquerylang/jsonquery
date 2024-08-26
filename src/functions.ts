import { Getter, JSONPath, JSONProperty, JSONQuery, JSONQueryObject } from './types'
import { compile } from './compile'
import { isArray, isString } from './utils'

export const get = (path: JSONPath | JSONProperty) =>
  isArray(path)
    ? (data: unknown) => {
        let value = data

        for (const prop of path) {
          value = value?.[prop]
        }

        return value
      }
    : (data: unknown) => data?.[path]

export const string = (text: string) => () => text

export const pipe = (entries: JSONQuery[]) => {
  const _entries = entries.map(compile)
  return (data: unknown) => _entries.reduce((data, evaluator) => evaluator(data), data)
}

export const object = (query: JSONQueryObject) => {
  const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key])])

  return (data: unknown) => {
    const obj = {}
    getters.forEach(([key, getter]) => (obj[key] = getter(data)))
    return obj
  }
}

export const map = <T>(callback: JSONQuery) => {
  const _callback = compile(callback)
  return (data: T[]) => data.map(_callback)
}

export const filter = <T>(predicate: JSONQuery) => {
  const _predicate = compile(predicate)
  return (data: T[]) => data.filter(_predicate)
}

export const sort = <T>(path: JSONPath | JSONProperty = [], direction?: 'asc' | 'desc') => {
  const getter = get(path)
  const sign = direction === 'desc' ? -1 : 1

  function compare(itemA: unknown, itemB: unknown) {
    const a = getter(itemA)
    const b = getter(itemB)
    return a > b ? sign : a < b ? -sign : 0
  }

  return (data: T[]) => data.slice().sort(compare)
}

export const pick = (...paths: (JSONPath | JSONProperty)[]) => {
  const getters: Getter[] = paths.map((path) => [
    isString(path) ? path : path[path.length - 1],
    get(path)
  ])

  return (data: Record<string, unknown>): unknown => {
    if (isArray(data)) {
      return data.map((item: Record<string, unknown>) => _pick(item, getters))
    }

    return _pick(data, getters)
  }
}

const _pick = (object: Record<string, unknown>, getters: Getter[]): unknown => {
  const out = {}

  getters.forEach(([key, getter]) => {
    out[key] = getter(object)
  })

  return out
}

export const groupBy = <T>(path: JSONPath | JSONProperty) => {
  const getter = get(path)

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

export const keyBy = <T>(path: JSONPath | JSONProperty) => {
  const getter = get(path)

  return (data: T[]) => {
    const res = {}

    data.forEach((item) => {
      const value = getter(item) as string
      res[value] = res[value] ?? item
    })

    return res
  }
}

export const flatten = () => (data: unknown[]) => data.flat()

export const uniq =
  () =>
  <T>(data: T[]) => [...new Set(data)]

export const uniqBy =
  <T>(path: JSONPath | JSONProperty) =>
  (data: T[]): T[] =>
    Object.values(groupBy(path)(data)).map((groups) => groups[0])

// operator not (looks like a function because it has no left operand)
export const not = (query: JSONQuery) => {
  const getter = compile(query)
  return (data: unknown) => !getter(data)
}

// operator exists (looks like a function because it has no left operand)
export const exists = (path: JSONPath) => {
  const getter = get(path)
  return (data: unknown) => getter(data) !== undefined
}

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

export const abs = () => Math.abs

export const round =
  (digits = 0) =>
  (data: number) => {
    const num = Math.round(Number(data + 'e' + digits))
    return Number(num + 'e' + -digits)
  }

export const size =
  () =>
  <T>(data: T[]) =>
    data.length
