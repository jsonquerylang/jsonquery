import { FunctionsMap, JSONQuery, Operator } from './types'
import { get } from './functions'
import { isString } from './is'
import { compile } from './compile'

export const compileOperator = (op: Operator) => (left: JSONQuery, right: JSONQuery) => {
  const a = compile(left)
  const b = compile(right)
  return (data: unknown) => op(a(data), b(data))
}

export const compileRelationalOperator = (op: Operator) => (left: JSONQuery, right: JSONQuery) => {
  // Special rule: relational operators interpret a string on the right side as a text and not a path
  const a = compile(left)
  const b = isString(right) ? () => right : compile(right)
  return (data: unknown) => op(a(data), b(data))
}

const mapValues = <T, U>(object: Record<string, T>, callback: (value: T) => U) =>
  Object.keys(object).reduce((res, key) => {
    res[key] = callback(object[key])

    return res
  }, {})

export const arithmeticOperators: Record<string, Operator> = {
  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
  '^': (a: number, b: number) => a ** b,
  '%': (a: number, b: number) => a % b
}

export const logicalOperators: Record<string, Operator> = {
  and: (a, b) => a && b,
  or: (a, b) => a || b
}

export const relationalOperators: Record<string, Operator> = {
  '==': (a, b) => a === b, // we use strict comparison
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b // we use strict comparison
}

export const coreOperators: FunctionsMap = {
  ...mapValues(arithmeticOperators, compileOperator),
  ...mapValues(logicalOperators, compileOperator),
  ...mapValues(relationalOperators, compileRelationalOperator),

  in: (path: string, values: string[]) => {
    const getter = get(path)
    return (data: unknown) => values.includes(getter(data))
  },
  'not in': (path: string, values: string[]) => {
    const getter = get(path)
    return (data: unknown) => !values.includes(getter(data))
  },
  regex: (path: string, expression: string, options?: string) => {
    const regex = new RegExp(expression, options)
    const getter = get(path)
    return (data: unknown) => regex.test(getter(data) as string)
  }
}
