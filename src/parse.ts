/**
 * Example:
 *
 *   .friends
 *     | filter(.city == "new York")
 *     | sort(.age)
 *     | pick(.name, .age)
 *
 */
import { functions } from './functions'
import { JSONQuery, JSONQueryParseOptions } from './types'
import {
  operators,
  startsWithKeywordRegex,
  startsWithNumberRegex,
  startsWithStringRegex,
  startsWithUnquotedPropertyRegex,
  startsWithWhitespaceRegex
} from './constants'

export function parse(query: string, options?: JSONQueryParseOptions): JSONQuery {
  const parseString = () => parseRegex(startsWithStringRegex, JSON.parse)
  const parseUnquotedString = () => parseRegex(startsWithUnquotedPropertyRegex, (text) => text)
  const parseNumber = () => parseRegex(startsWithNumberRegex, JSON.parse)
  const parseKeyword = () => parseRegex(startsWithKeywordRegex, JSON.parse)
  const parseWhitespace = () => parseRegex(startsWithWhitespaceRegex, (text) => text)

  const allOperators = { ...operators, ...options?.operators }

  let i = 0
  const output = parsePipe()

  // verify that there is no garbage at the end
  parseWhitespace()
  if (i < query.length) {
    throw new Error(`Unexpected part "${query.substring(i)}"`)
  }

  return output

  function parsePipe() {
    parseWhitespace()

    let evaluator = null
    const pipe = []
    while ((evaluator = parseParentheses()) !== undefined) {
      pipe.push(evaluator)

      parseWhitespace()
      if (query[i] === '|') {
        i++
        parseWhitespace()
      }
    }

    return pipe.length === 1 ? pipe[0] : pipe
  }

  function parseParentheses() {
    if (query[i] === '(') {
      i++
      const inner = parsePipe()
      eatChar(')')
      return inner
    }

    return parseOperator()
  }

  function parseOperator() {
    const left = parseProperty()

    parseWhitespace()

    for (const name of Object.keys(allOperators)) {
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

  function parseProperty() {
    const props = []

    while (query[i] === '.') {
      i++

      const property = parseString() ?? parseUnquotedString()
      if (property === undefined) {
        throw new SyntaxError('Property expected (pos: ${i})')
      }
      props.push(property)
    }

    return props.length ? ['get', ...props] : parseFunction()
  }

  function parseFunction() {
    const start = i
    const name = parseUnquotedString()
    parseWhitespace()
    if (!name || query[i] !== '(') {
      i = start
      return parseObject()
    }
    i++

    if (!options?.functions.has(name) && !functions[name]) {
      throw new Error(`Unknown function "${name}" (pos: ${start})`)
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

  function parseObject() {
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
        const key = parseString() ?? parseUnquotedString()
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

  function parseRegex<T = string>(regex: RegExp, callback: (match: string) => T): T | undefined {
    const match = query.substring(i).match(regex)
    if (match) {
      i += match[0].length
      return callback(match[0])
    }
  }

  function eatChar(char: string) {
    if (query[i] !== char) {
      throw new SyntaxError(`Character "${char}" expected (pos: ${i})`)
    }
    i++
  }
}
