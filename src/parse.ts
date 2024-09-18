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
  const parsePipe = () => {
    skipWhitespace()
    const first = parseOperator()
    skipWhitespace()

    if (query[i] === '|') {
      const pipe = [first]

      while (query[i] === '|') {
        i++
        skipWhitespace()

        pipe.push(parseOperator())
      }

      return pipe
    }

    return first
  }

  const parseOperator = () => {
    const allOperators = { ...operators, ...options?.operators }

    const left = parseParentheses()

    skipWhitespace()

    // we sort the operators from longest to shortest, so we first handle "<=" and next "<"
    for (const name of Object.keys(allOperators).sort((a, b) => b.length - a.length)) {
      const op = allOperators[name]
      if (query.substring(i, i + op.length) === op) {
        i += op.length
        skipWhitespace()
        const right = parseParentheses()

        return [name, left, right]
      }
    }

    return left
  }

  const parseParentheses = () => {
    if (query[i] === '(') {
      i++
      const inner = parsePipe()
      eatChar(')')
      return inner
    }

    return parseProperty()
  }

  const parseProperty = () => {
    const props = []

    if (query[i] === '.') {
      while (query[i] === '.') {
        i++

        const property = parseString() ?? parseUnquotedString() ?? parseInt()
        if (property !== undefined) {
          props.push(property)
        }
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
      throw new SyntaxError(`Unknown function '${name}' (pos: ${start})`)
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

        skipWhitespace()
        eatChar(':')

        const value = parsePipe()
        if (value === undefined) {
          throw new SyntaxError(`Value expected (pos: ${i})`)
        }
        object[key] = value

        skipWhitespace()
        if (query[i] !== '}') {
          eatChar(',')
          skipWhitespace()
        }
      }

      eatChar('}')

      return object
    }

    return parseString() ?? parseNumber() ?? parseKeyword()
  }

  const parseString = () => parseRegex(startsWithStringRegex, JSON.parse)

  const parseUnquotedString = () => parseRegex(startsWithUnquotedPropertyRegex, (text) => text)

  const parseNumber = () => parseRegex(startsWithNumberRegex, JSON.parse)

  const parseInt = () => parseRegex(startsWithIntRegex, JSON.parse)

  const parseKeyword = () => {
    const keyword = parseRegex(startsWithKeywordRegex, JSON.parse)
    if (keyword !== undefined) {
      return keyword
    }

    // end of the parsing chain
    throw new SyntaxError(`Value expected (pos: ${i})`)
  }

  const parseEnd = () => {
    skipWhitespace()

    if (i < query.length) {
      throw new SyntaxError(`Unexpected part '${query.substring(i)}' (pos: ${i})`)
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
      throw new SyntaxError(`Character '${char}' expected (pos: ${i})`)
    }
    i++
  }

  let i = 0
  const output = parsePipe()
  parseEnd()

  return output
}
