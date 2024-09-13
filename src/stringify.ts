import { JSONPath, JSONQuery, JSONQueryFunction, JSONQueryObject } from './types'
import { isArray, isObject, isString } from './is'

export function stringify(query: JSONQuery): string {
  if (isArray(query)) {
    // function
    if (isString(query[0])) {
      return stringifyFunction(query as JSONQueryFunction)
    }

    // pipe
    // TODO: pretty formatting of pipes
    return query.map(stringify).join(' | ')
  }

  // object
  if (isObject(query)) {
    return stringifyObject(query)
  }

  // value (string, number, boolean, null)
  return JSON.stringify(query)
}

function stringifyFunction(query: JSONQueryFunction) {
  const [name, ...args] = query

  if (name === 'get') {
    return stringifyPath(args as JSONPath)
  }

  const op = operators[name]
  if (op && args.length === 2) {
    const [left, right] = args
    return `(${stringify(left)} ${op} ${stringify(right)})`
  }

  const argsStr = args.map(stringify).join(', ')

  return args.length === 1 && argsStr[0] === '(' ? `${name}${argsStr}` : `${name}(${argsStr})`
}

function stringifyObject(query: JSONQueryObject) {
  // TODO: pretty formatting of objects
  const entries = Object.entries(query).map(([key, value]) => {
    return `${stringifyProperty(key)}: ${stringify(value)}`
  })

  return `{ ${entries.join(', ')} }`
}

function stringifyPath(path: JSONPath): string {
  return path.map((prop) => '.' + stringifyProperty(prop)).join('')
}

function stringifyProperty(prop: string): string {
  // TODO: think through the exact conditions for unquoted properties
  return /^[A-z_$]+$/.test(prop) ? prop : JSON.stringify(prop)
}

const operators = {
  and: 'and',
  or: 'or',

  eq: '==',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '!=',

  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/',
  pow: '^',
  mod: '%'
}
