import {
  operators,
  startsWithIntRegex,
  startsWithKeywordRegex,
  startsWithNumberRegex,
  startsWithStringRegex,
  startsWithUnquotedPropertyRegex,
  startsWithWhitespaceRegex
} from './constants'
import { functions } from './functions'
import type { JSONQuery, JSONQueryParseOptions } from './types'

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
  const allOperators = options?.operators ?? operators

  const parsePipe = () => {
    skipWhitespace()
    const first = parseOperator(0)
    skipWhitespace()

    if (query[i] === '|') {
      const pipe = [first]

      while (query[i] === '|') {
        i++
        skipWhitespace()

        pipe.push(parseOperator(0))
      }

      return ['pipe', ...pipe]
    }

    return first
  }

  const parseOperator = (precedenceLevel: number) => {
    const currentOperators = allOperators[precedenceLevel]
    if (!currentOperators) {
      return parseParenthesis()
    }

    let left = parseOperator(precedenceLevel + 1)

    skipWhitespace()

    while (true) {
      const name = parseOperatorName(currentOperators)
      if (!name) {
        break
      }

      const right = parseOperator(precedenceLevel + 1)
      left = [name, left, right]

      skipWhitespace()
    }

    return left
  }

  const parseOperatorName = (currentOperators: Record<string, string>): string | undefined => {
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
    if (query[i] === '(') {
      i++
      const inner = parsePipe()
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

    if (!options?.functions[name] && !functions[name]) {
      throwError(`Unknown function '${name}'`)
    }

    skipWhitespace()

    const args = query[i] !== ')' ? [parsePipe()] : []
    while (i < query.length && query[i] !== ')') {
      skipWhitespace()
      eatChar(',')
      args.push(parsePipe())
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

        object[key] = parsePipe()
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

        array.push(parsePipe())
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
  const output = parsePipe()
  parseEnd()

  return output
}
