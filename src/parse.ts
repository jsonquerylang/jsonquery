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
import { JSONQuery } from './types'

export function parse(query: string): JSONQuery {
  // TODO: pass a list with function names
  // TODO: pass a list with operator names
  // TODO: operator
  // TODO: object
  // TODO: parenthesis
  // TODO: numbers, null, boolean

  let i = 0

  return parseStart() ?? parseEnd()

  function parseStart() {
    skipWhitespace()

    let evaluator = null
    const pipe = []
    while ((evaluator = parseProperty())) {
      pipe.push(evaluator)

      skipWhitespace()
      if (query[i] === '|') {
        i++
        skipWhitespace()
      }
    }

    return pipe.length === 1 ? pipe[0] : pipe
  }

  function parseProperty() {
    if (query[i] === '.') {
      const props = []

      while (query[i] === '.') {
        i++

        const property = parseString()
        if (property === undefined) {
          throw new Error('String expected')
        }
        props.push(property)
      }

      return ['get', ...props]
    }

    return parseFunction()
  }

  function parseFunction() {
    if (isAlpha(query[i])) {
      const start = i
      while (isAlpha(query[i])) {
        i++
      }
      const name = query.slice(start, i)
      // console.log('parsing function', { name })
      const fn = functions[name]
      if (!fn) {
        throw new Error(`Unknown function "${name}" (pos: ${i - name.length})`)
      }

      skipWhitespace()
      if (query[i] !== '(') {
        throw new Error(`Parenthesis "(" expected (pos: ${i})"`)
      }
      i++

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
        throw new Error(`Comma "," or parenthesis ")" expected (pos: ${i})"`)
      }
      i++

      return [name, ...args]
    }

    return parseString()
  }

  function parseString() {
    skipWhitespace()

    if (query[i] === '"') {
      const start = i
      i++
      while (i < query.length && (query[i] !== '"' || query[i - 1] === '\\')) {
        i++
      }
      i++

      return JSON.parse(query.slice(start, i))
    }

    if (/^[A-z_$]$/.test(query[i])) {
      const start = i
      while (i < query.length && !isDelimiter(query[i]) && !isWhitespace(query[i])) {
        i++
      }
      return query.slice(start, i)
    }

    return undefined
  }

  // TODO: use function parseEnd
  function parseEnd() {
    skipWhitespace()

    if (i < query.length) {
      throw new Error(`Unexpected part "${query.slice(i)}"`)
    }

    // FIXME: test if anything was parsed
    return null // nothing
  }

  function skipWhitespace() {
    while (isWhitespace(query[i])) {
      i++
    }
  }
}

function isWhitespace(char: string): boolean {
  return char === ' ' || char === '\n' || char === '\t' || char === '\r'
}

function isDelimiter(char: string): boolean {
  return regexDelimiter.test(char)
}

const regexDelimiter = /^[.,|{}()]$/

function isAlpha(char: string): boolean {
  return alphaDelimiter.test(char)
}

const alphaDelimiter = /^[a-zA-Z_$]$/
