import { operators, unquotedPropertyRegex } from './constants'
import { isArray } from './is'
import type {
  JSONPath,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryStringifyOptions
} from './types'

/**
 * Stringify a JSON Query into a readable, human friendly text syntax.
 *
 * Example:
 *
 *     const jsonQuery = [
 *         ['get', 'friends'],
 *         ['filter', ['eq', ['get', 'city'], 'New York']],
 *         ['sort', ['get', 'age']],
 *         ['pick', ['get', 'name'], ['get', 'age']]
 *       ]
 *     const textQuery = stringify(jsonQuery)
 *     // textQuery = '.friends | filter(.city == "new York") | sort(.age) | pick(.name, .age)'
 */
export function stringify(query: JSONQuery, options?: JSONQueryStringifyOptions): string {
  return isArray(query)
    ? stringifyFunction(query as JSONQueryFunction, options)
    : JSON.stringify(query) // value (string, number, boolean, null)
}

function stringifyFunction(
  query: JSONQueryFunction,
  options: JSONQueryStringifyOptions | undefined
) {
  const [name, ...args] = query

  if (name === 'get') {
    return stringifyPath(args as JSONPath)
  }

  if (name === 'pipe') {
    return args.map((arg) => stringify(arg, options)).join(' | ')
  }

  if (name === 'object') {
    return stringifyObject(query[1] as JSONQueryObject, options)
  }

  if (name === 'array') {
    const argsStr = (query[1] as JSONQuery[]).map((arg) => stringify(arg, options)).join(', ')
    return `[${argsStr}]`
  }

  // operator like ".age >= 18"
  const op = options?.operators?.[name] ?? operators[name]
  if (op && args.length === 2) {
    const [left, right] = args
    return `(${stringify(left)} ${op} ${stringify(right)})`
  }

  // regular function like sort(.age)
  const argsStr = args.map((arg) => stringify(arg, options)).join(', ')
  return args.length === 1 && argsStr[0] === '(' ? `${name}${argsStr}` : `${name}(${argsStr})`
}

function stringifyObject(query: JSONQueryObject, options: JSONQueryStringifyOptions | undefined) {
  // TODO: pretty formatting of objects
  const entries = Object.entries(query).map(([key, value]) => {
    return `${stringifyProperty(key)}: ${stringify(value, options)}`
  })

  return `{ ${entries.join(', ')} }`
}

function stringifyPath(path: JSONPath): string {
  return path.map((prop) => `.${stringifyProperty(prop)}`).join('')
}

function stringifyProperty(prop: string): string {
  return unquotedPropertyRegex.test(prop) ? prop : JSON.stringify(prop)
}
