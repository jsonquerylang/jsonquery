import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import type { ParseTestException, ParseTestSuite } from '../test-suite/parse'
import schema from '../test-suite/parse.schema.json'
import suite from '../test-suite/parse.test.json'
import { compile } from './compile'
import { parse } from './parse'
import type { JSONQueryParseOptions } from './types'

function isTestException(test: unknown): test is ParseTestException {
  return !!test && typeof (test as Record<string, unknown>).throws === 'string'
}

const groupByCategory = compile(['groupBy', ['get', 'category']])
const testsByCategory = groupByCategory(suite.groups) as Record<string, ParseTestSuite['groups']>

for (const [category, testGroups] of Object.entries(testsByCategory)) {
  describe(category, () => {
    for (const group of testGroups) {
      describe(group.description, () => {
        for (const currentTest of group.tests) {
          const description = `input = '${currentTest.input}'`

          if (isTestException(currentTest)) {
            test(description, () => {
              const { input, throws } = currentTest

              expect(() => parse(input)).toThrow(throws)
            })
          } else {
            test(description, () => {
              const { input, output } = currentTest

              expect(parse(input)).toEqual(output)
            })
          }
        }
      })
    }
  })
}

describe('test-suite', () => {
  test('should validate the test-suite itself against its JSON schema', () => {
    const ajv = new Ajv({ allErrors: false })
    const valid = ajv.validate(schema, suite)

    expect(ajv.errors).toEqual(null)
    expect(valid).toEqual(true)
  })
})

describe('customization', () => {
  test('should parse a custom function', () => {
    const options: JSONQueryParseOptions = {
      functions: { customFn: true }
    }

    expect(parse('customFn(.age, "desc")', options)).toEqual(['customFn', ['get', 'age'], 'desc'])
  })

  test('should parse a custom operator', () => {
    const options: JSONQueryParseOptions = {
      operators: { aboutEq: '~=' }
    }

    expect(parse('.score ~= 8', options)).toEqual(['aboutEq', ['get', 'score'], 8])
  })
})
