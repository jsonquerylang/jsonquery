import { functions } from './functions'
import { extendOperators, leftAssociativeOperators, operators, varargOperators } from './operators'
import {
  startsWithIntRegex,
  startsWithKeywordRegex,
  startsWithNumberRegex,
  startsWithStringRegex,
  startsWithUnquotedPropertyRegex,
  startsWithWhitespaceRegex
} from './regexps'
import type { JSONQuery, JSONQueryParseOptions, OperatorGroup } from './types'

/**
 * Parse a string containing a JSON Query into JSON.
 *
 * Example:
 *
 *     const textQuery = '.friends | filter(.city == "new York") | sort(.age) | pick(.name, .age)'
 *     const jsonQuery = parse(textQuery)
 *     // jsonQuery = [
 *     //    'pipe',
 *     //    ['get', 'friends'],
 *     //    ['filter', ['eq', ['get', 'city'], 'New York']],
 *     //    ['sort', ['get', 'age']],
 *     //    ['pick', ['get', 'name'], ['get', 'age']]
 *     //  ]
 */
export function parse(query: string, options?: JSONQueryParseOptions): JSONQuery {
  const customOperators = options?.operators ?? []
  const allFunctions = { ...functions, ...options?.functions }
  const allOperators = extendOperators(operators, customOperators)
  const allOperatorsMap = Object.assign({}, ...allOperators)
  const allVarargOperators = varargOperators.concat(
    customOperators.filter((op) => op.vararg).map((op) => op.op)
  )
  const allLeftAssociativeOperators = leftAssociativeOperators.concat(
    customOperators.filter((op) => op.leftAssociative).map((op) => op.op)
  )

  const parseOperator = (precedenceLevel = allOperators.length - 1) => {
    const currentOperators = allOperators[precedenceLevel]
    if (!currentOperators) {
      return parseParenthesis()
    }

    const leftParenthesis = query[i] === '('
    let left = parseOperator(precedenceLevel - 1)

    while (true) {
      skipWhitespace()

      const start = i
      const name = parseOperatorName(currentOperators)
      if (!name) {
        break
      }

      const right = parseOperator(precedenceLevel - 1)

      const childName = left[0]
      const chained = name === childName && !leftParenthesis
      if (chained && !allLeftAssociativeOperators.includes(allOperatorsMap[name])) {
        i = start
        break
      }

      left =
        chained && allVarargOperators.includes(allOperatorsMap[name])
          ? [...left, right]
          : [name, left, right]
    }

    return left
  }

  const parseOperatorName = (currentOperators: OperatorGroup): string | undefined => {
    // we sort the operators from longest to shortest, so we first handle "<=" and next "<"
    const sortedOperatorNames = Object.keys(currentOperators).sort((a, b) => b.length - a.length)

    for (const name of sortedOperatorNames) {
      const op = currentOperators[name]
      if (query.substring(i, i + op.length) === op) {
        i += op.length

        skipWhitespace()

        return name
      }
    }

    return undefined
  }

  const parseParenthesis = () => {
    skipWhitespace()

    if (query[i] === '(') {
      i++
      const inner = parseOperator()
      eatChar(')')
      return inner
    }

    return parseProperty()
  }

  const parseProperty = () => {
    if (query[i] === '.') {
      const props = []

      while (query[i] === '.') {
        i++

        props.push(
          parseString() ??
            parseUnquotedString() ??
            parseInteger() ??
            throwError('Property expected')
        )
      }

      return ['get', ...props]
    }

    return parseFunction()
  }

  const parseFunction = () => {
    const start = i
    const name = parseUnquotedString()
    skipWhitespace()
    if (!name || query[i] !== '(') {
      i = start
      return parseObject()
    }
    i++

    if (!allFunctions[name]) {
      throwError(`Unknown function '${name}'`)
    }

    skipWhitespace()

    const args = query[i] !== ')' ? [parseOperator()] : []
    while (i < query.length && query[i] !== ')') {
      skipWhitespace()
      eatChar(',')
      args.push(parseOperator())
    }

    eatChar(')')

    return [name, ...args]
  }

  const parseObject = () => {
    if (query[i] === '{') {
      i++
      skipWhitespace()

      const object = {}
      let first = true
      while (i < query.length && query[i] !== '}') {
        if (first) {
          first = false
        } else {
          eatChar(',')
          skipWhitespace()
        }

        const key =
          parseString() ?? parseUnquotedString() ?? parseInteger() ?? throwError('Key expected')

        skipWhitespace()
        eatChar(':')

        object[key] = parseOperator()
      }

      eatChar('}')

      return ['object', object]
    }

    return parseArray()
  }

  const parseArray = () => {
    if (query[i] === '[') {
      i++
      skipWhitespace()

      const array = []

      let first = true
      while (i < query.length && query[i] !== ']') {
        if (first) {
          first = false
        } else {
          eatChar(',')
          skipWhitespace()
        }

        array.push(parseOperator())
      }

      eatChar(']')

      return ['array', ...array]
    }

    return parseString() ?? parseNumber() ?? parseKeyword()
  }

  const parseString = () => parseRegex(startsWithStringRegex, JSON.parse)

  const parseUnquotedString = () => parseRegex(startsWithUnquotedPropertyRegex, (text) => text)

  const parseNumber = () => parseRegex(startsWithNumberRegex, JSON.parse)

  const parseInteger = () => parseRegex(startsWithIntRegex, JSON.parse)

  const parseKeyword = () => {
    const keyword = parseRegex(startsWithKeywordRegex, JSON.parse)
    if (keyword !== undefined) {
      return keyword
    }

    // end of the parsing chain
    throwError('Value expected')
  }

  const parseEnd = () => {
    skipWhitespace()

    if (i < query.length) {
      throwError(`Unexpected part '${query.substring(i)}'`)
    }
  }

  const parseRegex = <T = string>(regex: RegExp, callback: (match: string) => T): T | undefined => {
    const match = query.substring(i).match(regex)
    if (match) {
      i += match[0].length
      return callback(match[0])
    }
  }

  const skipWhitespace = () => parseRegex(startsWithWhitespaceRegex, (text) => text)

  const eatChar = (char: string) => {
    if (query[i] !== char) {
      throwError(`Character '${char}' expected`)
    }
    i++
  }

  const throwError = (message: string, pos = i) => {
    throw new SyntaxError(`${message} (pos: ${pos})`)
  }

  let i = 0
  const output = parseOperator()
  parseEnd()

  return output
}
