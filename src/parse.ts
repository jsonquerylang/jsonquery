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
  alphaCharacterRegex,
  alphaDigitCharacterRegex,
  operators,
  startsWithKeywordRegex,
  startsWithNumberRegex,
  startsWithUnquotedPropertyRegex,
  whitespaceRegex
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
    if (query[i] === '.') {
      const props = []

      while (query[i] === '.') {
        i++

        const property = parseString() ?? parseUnquotedString()
        if (property === undefined) {
          throw new SyntaxError('String expected (pos: ${i})')
        }
        props.push(property)
      }

      return ['get', ...props]
    }

    return parseFunction()
  }

  function parseFunction() {
    if (alphaCharacterRegex.test(query[i])) {
      const start = i
      while (alphaDigitCharacterRegex.test(query[i])) {
        i++
      }
      const name = query.slice(start, i)
      skipWhitespace()
      if (query[i] !== '(') {
        i = start
        return parseObject()
      }
      i++

      if (!options?.functions.has(name) && !functions[name]) {
        throw new Error(`Unknown function "${name}" (pos: ${i - name.length})`)
      }

      skipWhitespace()
      const args = []
      while (i < query.length && query[i] !== ')') {
        const arg = parseStart()
        if (arg) {
          args.push(arg)
        }
        skipWhitespace()

        if (query[i] === ',') {
          i++
          skipWhitespace()
        }
      }

      if (query[i] !== ')') {
        throw new SyntaxError(`Comma "," or parenthesis ")" expected (pos: ${i})`)
      }
      i++

      return [name, ...args]
    }

    return parseObject()
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
    if (query[i] === '"') {
      const start = i
      i++
      while (i < query.length && (query[i] !== '"' || query[i - 1] === '\\')) {
        i++
      }
      i++

      return JSON.parse(query.slice(start, i))
    }
  }

  function parseUnquotedString() {
    const match = query.substring(i).match(startsWithUnquotedPropertyRegex)
    if (match) {
      i += match[0].length
      return match[0]
    }
  }

  function parseNumber() {
    const match = query.substring(i).match(startsWithNumberRegex)
    if (match) {
      i += match[0].length
      return Number(match[0])
    }
  }

  function parseKeyword() {
    const match = query.substring(i).match(startsWithKeywordRegex)
    if (match) {
      i += match[0].length
      return JSON.parse(match[0])
    }
  }

  function parseEnd() {
    skipWhitespace()

    if (i < query.length) {
      throw new Error(`Unexpected part "${query.slice(i)}"`)
    }
  }

  function skipWhitespace() {
    while (whitespaceRegex.test(query[i])) {
      i++
    }
  }

  function eatChar(char: string) {
    if (query[i] !== char) {
      throw new SyntaxError(`Character "${char}" expected (pos: ${i})`)
    }
    i++
  }
}
