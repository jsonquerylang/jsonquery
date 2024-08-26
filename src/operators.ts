import { FunctionsMap, Operator } from './types'
import { get } from './functions'

export const relationalOperators: Record<string, Operator> = {
  '==': (a, b) => a === b, // we use strict comparison
  '>': (a, b) => a > b,
  '>=': (a, b) => a >= b,
  '<': (a, b) => a < b,
  '<=': (a, b) => a <= b,
  '!=': (a, b) => a !== b // we use strict comparison
}

export const rawOperators: Record<string, Operator> = {
  ...relationalOperators,

  and: (a, b) => a && b,
  or: (a, b) => a || b,

  '+': (a: number, b: number) => a + b,
  '-': (a: number, b: number) => a - b,
  '*': (a: number, b: number) => a * b,
  '/': (a: number, b: number) => a / b,
  '^': (a: number, b: number) => a ** b,
  '%': (a: number, b: number) => a % b
}

export const coreOperators: FunctionsMap = {
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
