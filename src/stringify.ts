import { isArray } from './is'
import { extendOperators, leftAssociativeOperators, operators } from './operators'
import { unquotedPropertyRegex } from './regexps'
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
  const customOperators = options?.operators ?? []
  const allOperators = extendOperators(operators, customOperators)
  const allOperatorsMap = Object.assign({}, ...allOperators)
  const allLeftAssociativeOperators = leftAssociativeOperators.concat(
    customOperators.filter((op) => op.leftAssociative).map((op) => op.op)
  )

  const _stringify = (query: JSONQuery, indent: string, parenthesis = false) =>
    isArray(query)
      ? stringifyFunction(query as JSONQueryFunction, indent, parenthesis)
      : JSON.stringify(query) // value (string, number, boolean, null)

  const stringifyFunction = (query: JSONQueryFunction, indent: string, parenthesis: boolean) => {
    const [name, ...args] = query

    if (name === 'get' && args.length > 0) {
      return stringifyPath(args as JSONPath)
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
    if (op) {
      const start = parenthesis ? '(' : ''
      const end = parenthesis ? ')' : ''

      const argsStr = args.map((arg, index) => {
        const childName = arg?.[0]
        const precedence = allOperators.findIndex((group) => name in group)
        const childPrecedence = allOperators.findIndex((group) => childName in group)
        const childParenthesis =
          precedence < childPrecedence ||
          (precedence === childPrecedence && index > 0) ||
          (name === childName && !allLeftAssociativeOperators.includes(op))

        return _stringify(arg, indent + space, childParenthesis)
      })

      return join(argsStr, [start, ` ${op} `, end], [start, `\n${indent + space}${op} `, end])
    }

    // regular function like "sort(.age)"
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
