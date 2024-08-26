import {
  Evaluator,
  FunctionsMap,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryOperator,
  JSONQueryOptions,
  JSONQueryPipe
} from './types'
import { isArray, isObject, isString } from './is'
import * as coreFunctions from './functions'
import { get, object, pipe } from './functions'
import { coreOperators } from './operators'

export function compile(query: JSONQuery, options?: JSONQueryOptions): Evaluator {
  try {
    functionsStack.unshift({
      ...(functionsStack[0] as object),
      ...(options?.functions as object | undefined)
    })

    return _compile(query)
  } finally {
    functionsStack.shift()
  }
}

function _compile(query: JSONQuery): Evaluator {
  // object
  if (isObject(query)) {
    return object(query as JSONQueryObject)
  }

  if (isArray(query)) {
    // function
    const [fnName, ...args] = query as unknown as JSONQueryFunction
    const fn = functionsStack[0][fnName]
    if (fn) {
      return fn(...args)
    }

    // operator
    const [left, opName, ...right] = query as unknown as JSONQueryOperator
    const op = coreOperators[opName]
    if (op) {
      return op(left, ...right)
    }

    // pipe
    return pipe(query as JSONQueryPipe)
  }

  // property
  if (isString(query)) {
    return get(query)
  }

  // value
  return () => query
}

const functionsStack: FunctionsMap[] = [coreFunctions]
