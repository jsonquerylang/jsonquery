import { functions } from './functions'
import { isArray, isObject, isString } from './is'
import type {
  Fun,
  FunctionBuildersMap,
  Getter,
  JSONQuery,
  JSONQueryCompileOptions,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryPipe
} from './types'

const functionsStack: FunctionBuildersMap[] = []

export function compile(query: JSONQuery, options?: JSONQueryCompileOptions): Fun {
  functionsStack.unshift({ ...functions, ...functionsStack[0], ...options?.functions })

  try {
    const exec = _compile(query, functionsStack[0])

    return (data) => {
      try {
        return exec(data)
      } catch (err) {
        // attach a stack to the error
        err.jsonquery = [{ data, query }, ...(err.jsonquery ?? [])]

        throw err
      }
    }
  } finally {
    functionsStack.shift()
  }
}

function _compile(query: JSONQuery, functions: FunctionBuildersMap): Fun {
  if (isArray(query)) {
    // function
    if (isString(query[0])) {
      return fun(query as JSONQueryFunction, functions)
    }

    // pipe
    return pipe(query as JSONQueryPipe)
  }

  // object
  if (isObject(query)) {
    return object(query as JSONQueryObject)
  }

  // value (string, number, boolean, null)
  return () => query
}

function fun(query: JSONQueryFunction, functions: FunctionBuildersMap) {
  const [fnName, ...args] = query

  const fnBuilder = functions[fnName]
  if (!fnBuilder) {
    throw new Error(`Unknown function "${fnName}"`)
  }

  return fnBuilder(...args)
}

function pipe(entries: JSONQuery[]) {
  const _entries = entries.map((entry) => compile(entry))
  return (data: unknown) => _entries.reduce((data, evaluator) => evaluator(data), data)
}

function object(query: JSONQueryObject) {
  const getters: Getter[] = Object.keys(query).map((key) => [key, compile(query[key])])

  return (data: unknown) => {
    const obj = {}
    for (const [key, getter] of getters) {
      obj[key] = getter(data)
    }
    return obj
  }
}
