import { operators, unquotedPropertyRegex } from './constants'
import { isArray } from './is'
import type {
  JSONPath,
  JSONQuery,
  JSONQueryFunction,
  JSONQueryObject,
  JSONQueryStringifyOptions
} from './types'

const DEFAULT_MAX_LINE_LENGTH = 40
const DEFAULT_INDENTATION = '  '

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
 *
 * @param query The JSON Query to be stringified
 * @param {Object} [options] An object which can have the following options:
 *                 `maxLineLength` Optional maximum line length. When the query exceeds this maximum,
 *                                 It will be formatted over multiple lines. Default value: 40.
 *                 `indentation`   Optional indentation. Defaults to a string with two spaces: '  '.
 */
export const stringify = (query: JSONQuery, options?: JSONQueryStringifyOptions) => {
  const space = options?.indentation ?? DEFAULT_INDENTATION
  const allOperators = options?.operators ?? operators
  const allOperatorsMap = Object.assign({}, ...allOperators)

  const _stringify = (
    query: JSONQuery,
    indent: string,
    operatorPrecedence = allOperators.length - 1
  ) =>
    isArray(query)
      ? stringifyFunction(query as JSONQueryFunction, indent, operatorPrecedence)
      : JSON.stringify(query) // value (string, number, boolean, null)

  const stringifyFunction = (
    query: JSONQueryFunction,
    indent: string,
    parentPrecedence: number
  ) => {
    const [name, ...args] = query

    if (name === 'get' && args.length > 0) {
      return stringifyPath(args as JSONPath)
    }

    if (name === 'pipe') {
      const argsStr = args.map((arg) => _stringify(arg, indent + space))

      return join(argsStr, ['', ' | ', ''], ['', `\n${indent + space}| `, ''])
    }

    if (name === 'object') {
      return stringifyObject(args[0] as JSONQueryObject, indent)
    }

    if (name === 'array') {
      const argsStr = args.map((arg) => _stringify(arg, indent))
      return join(
        argsStr,
        ['[', ', ', ']'],
        [`[\n${indent + space}`, `,\n${indent + space}`, `\n${indent}]`]
      )
    }

    // operator like ".age >= 18"
    const op = allOperatorsMap[name]
    if (op && args.length === 2) {
      const precedence = allOperators.findIndex((group) => name in group)
      const [left, right] = args
      const leftStr = _stringify(left, indent, precedence)
      const rightStr = _stringify(right, indent, precedence)

      return parentPrecedence < precedence
        ? `(${leftStr} ${op} ${rightStr})`
        : `${leftStr} ${op} ${rightStr}`
    }

    // regular function like sort(.age)
    const childIndent = args.length === 1 ? indent : indent + space
    const argsStr = args.map((arg) => _stringify(arg, childIndent))
    return join(
      argsStr,
      [`${name}(`, ', ', ')'],
      args.length === 1
        ? [`${name}(`, `,\n${indent}`, ')']
        : [`${name}(\n${childIndent}`, `,\n${childIndent}`, `\n${indent})`]
    )
  }

  const stringifyObject = (query: JSONQueryObject, indent: string) => {
    const childIndent = indent + space
    const entries = Object.entries(query).map(([key, value]) => {
      return `${stringifyProperty(key)}: ${_stringify(value, childIndent)}`
    })

    return join(
      entries,
      ['{ ', ', ', ' }'],
      [`{\n${childIndent}`, `,\n${childIndent}`, `\n${indent}}`]
    )
  }

  const stringifyPath = (path: JSONPath): string =>
    path.map((prop) => `.${stringifyProperty(prop)}`).join('')

  const stringifyProperty = (prop: string): string =>
    unquotedPropertyRegex.test(prop) ? prop : JSON.stringify(prop)

  type JoinDefinition = [start: string, separator: string, end: string]

  const join = (
    items: string[],
    [compactStart, compactSeparator, compactEnd]: JoinDefinition,
    [formatStart, formatSeparator, formatEnd]: JoinDefinition
  ): string => {
    const compactLength =
      compactStart.length +
      items.reduce((sum: number, item: string) => sum + item.length + compactSeparator.length, 0) -
      compactSeparator.length +
      compactEnd.length

    return compactLength <= (options?.maxLineLength ?? DEFAULT_MAX_LINE_LENGTH)
      ? compactStart + items.join(compactSeparator) + compactEnd
      : formatStart + items.join(formatSeparator) + formatEnd
  }

  return _stringify(query, '')
}
