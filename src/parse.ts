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
  const allOperators = { ...operators, ...options?.operators }

  let i = 0

  const res = parseStart()
  parseEnd()
  return res

  function parseStart() {
    return parsePipe()
  }

  function parsePipe() {
    skipWhitespace()

    let evaluator = null
    const pipe = []
    while ((evaluator = parseParentheses()) !== undefined) {
      pipe.push(evaluator)

      skipWhitespace()
      if (query[i] === '|') {
        i++
        skipWhitespace()
      }
    }

    return pipe.length === 1 ? pipe[0] : pipe
  }

  function parseParentheses() {
    if (query[i] === '(') {
      i++
      const inner = parseStart()
      eatChar(')')
      return inner
    }

    return parseOperator()
  }

  function parseOperator() {
    const left = parseProperty()

    skipWhitespace()

    for (const name of Object.keys(allOperators)) {
      const op = allOperators[name]
      if (query.substring(i, i + op.length) === op) {
        i += op.length
        skipWhitespace()
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
    skipWhitespace()
    if (!name || query[i] !== '(') {
      i = start
      return parseObject()
    }
    i++

    if (!options?.functions.has(name) && !functions[name]) {
      throw new Error(`Unknown function "${name}" (pos: ${start})`)
    }

    skipWhitespace()

    const args = query[i] !== ')' ? [parseStart()] : []
    while (i < query.length && query[i] !== ')') {
      skipWhitespace()
      eatChar(',')
      args.push(parseStart())
    }
    eatChar(')')

    return [name, ...args]
  }

  function parseObject() {
    if (query[i] === '{') {
      i++
      skipWhitespace()

      const object = {}
      let initial = true
      while (i < query.length && query[i] !== '}') {
        if (!initial) {
          eatChar(',')
          skipWhitespace()
        } else {
          initial = false
        }

        const start = i

        const key = parseString() ?? parseUnquotedString()
        if (key === undefined) {
          throw new SyntaxError(`Key expected (pos: ${start})`)
        }

        skipWhitespace()
        eatChar(':')

        const valueStart = i
        const value = parseStart()

        if (value === undefined) {
          throw new SyntaxError(`Value expected (pos: ${valueStart})`)
        }

        object[key] = value
      }

      if (query[i] !== '}') {
        throw new SyntaxError(`Key or end of object '}' expected (pos: ${i})`)
      }
      i++

      return object
    }

    return parseString() ?? parseNumber() ?? parseKeyword()
  }

  function parseString() {
    return parseRegex(startsWithStringRegex, JSON.parse)
  }

  function parseUnquotedString() {
    return parseRegex(startsWithUnquotedPropertyRegex)
  }

  function parseNumber() {
    return parseRegex(startsWithNumberRegex, Number)
  }

  function parseKeyword() {
    return parseRegex(startsWithKeywordRegex, JSON.parse)
  }

  function parseEnd() {
    skipWhitespace()

    if (i < query.length) {
      throw new Error(`Unexpected part "${query.slice(i)}"`)
    }
  }

  function skipWhitespace() {
    parseRegex(startsWithWhitespaceRegex)
  }

  function parseRegex<T = string>(
    regex: RegExp,
    callback: (match: string) => T = (match) => match as T
  ): T | undefined {
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
