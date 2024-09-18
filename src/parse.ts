import { functions } from './functions'
import { JSONQuery, JSONQueryParseOptions } from './types'
import {
  operators,
  startsWithIntRegex,
  startsWithKeywordRegex,
  startsWithNumberRegex,
  startsWithStringRegex,
  startsWithUnquotedPropertyRegex,
  startsWithWhitespaceRegex
} from './constants'

/**
 * Parse a string containing a JSON Query into JSON.
 *
 * Example:
 *
 *     const textQuery = '.friends | filter(.city == "new York") | sort(.age) | pick(.name, .age)'
 *     const jsonQuery = parse(textQuery)
 *     // jsonQuery = [
 *     //    ['get', 'friends'],
 *     //    ['filter', ['eq', ['get', 'city'], 'New York']],
 *     //    ['sort', ['get', 'age']],
 *     //    ['pick', ['get', 'name'], ['get', 'age']]
 *     //  ]
 */
export function parse(query: string, options?: JSONQueryParseOptions): JSONQuery {
  const parseString = () => parseRegex(startsWithStringRegex, JSON.parse)
  const parseUnquotedString = () => parseRegex(startsWithUnquotedPropertyRegex, (text) => text)
  const parseNumber = () => parseRegex(startsWithNumberRegex, JSON.parse)
  const parseInt = () => parseRegex(startsWithIntRegex, JSON.parse)
  const parseKeyword = () => parseRegex(startsWithKeywordRegex, JSON.parse)
  const parseWhitespace = () => parseRegex(startsWithWhitespaceRegex, (text) => text)

  const parsePipe = () => {
    parseWhitespace()
    const first = parseParentheses()
    parseWhitespace()

    if (query[i] === '|') {
      const pipe = [first]
      while (query[i] === '|') {
        i++
        parseWhitespace()

        pipe.push(parseParentheses())
      }

      return pipe
    }

    return first
  }

  const parseParentheses = () => {
    if (query[i] === '(') {
      i++
      const inner = parsePipe()
      eatChar(')')
      return inner
    }

    return parseOperator()
  }

  const parseOperator = () => {
    const allOperators = { ...operators, ...options?.operators }

    const left = parseProperty()

    parseWhitespace()

    // we sort the operators from longest to shortest, so we first handle "<=" and next "<"
    for (const name of Object.keys(allOperators).sort((a, b) => b.length - a.length)) {
      const op = allOperators[name]
      if (query.substring(i, i + op.length) === op) {
        i += op.length
        parseWhitespace()
        const right = parseProperty()

        return [name, left, right]
      }
    }

    return left
  }

  const parseProperty = () => {
    const props = []

    while (query[i] === '.') {
      i++

      const property = parseString() ?? parseUnquotedString() ?? parseInt()
      if (property === undefined) {
        throw new SyntaxError(`Property expected (pos: ${i})`)
      }
      props.push(property)
    }

    return props.length ? ['get', ...props] : parseFunction()
  }

  const parseFunction = () => {
    const start = i
    const name = parseUnquotedString()
    parseWhitespace()
    if (!name || query[i] !== '(') {
      i = start
      return parseObject()
    }
    i++

    if (!options?.functions[name] && !functions[name]) {
      throw new Error(`Unknown function '${name}' (pos: ${start})`)
    }

    parseWhitespace()

    const args = query[i] !== ')' ? [parsePipe()] : []
    while (i < query.length && query[i] !== ')') {
      parseWhitespace()
      eatChar(',')
      args.push(parsePipe())
    }

    eatChar(')')

    return [name, ...args]
  }

  const parseObject = () => {
    if (query[i] === '{') {
      i++
      parseWhitespace()

      const object = {}

      if (query[i] === '}') {
        // empty object
        i++
        return object
      }

      while (i < query.length && query[i] !== '}') {
        const key = parseString() ?? parseUnquotedString() ?? parseInt()
        if (key === undefined) {
          throw new SyntaxError(`Key expected (pos: ${i})`)
        }

        parseWhitespace()
        eatChar(':')

        const value = parsePipe()
        if (value === undefined) {
          throw new SyntaxError(`Value expected (pos: ${i})`)
        }
        object[key] = value

        parseWhitespace()
        if (query[i] !== '}') {
          eatChar(',')
          parseWhitespace()
        }
      }

      eatChar('}')

      return object
    }

    return parseString() ?? parseNumber() ?? parseKeyword()
  }

  const parseRegex = <T = string>(regex: RegExp, callback: (match: string) => T): T | undefined => {
    const match = query.substring(i).match(regex)
    if (match) {
      i += match[0].length
      return callback(match[0])
    }
  }

  const eatChar = (char: string) => {
    if (query[i] !== char) {
      throw new SyntaxError(`Character '${char}' expected (pos: ${i})`)
    }
    i++
  }

  let i = 0
  const output = parsePipe()

  // verify that there is no garbage at the end
  parseWhitespace()
  if (i < query.length) {
    throw new Error(`Unexpected part '${query.substring(i)}' (pos ${i})`)
  }

  return output
}
