import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import type { ParseTestException, ParseTestSuite } from '../test-suite/parse.test'
import suite from '../test-suite/parse.test.json'
import schema from '../test-suite/parse.test.schema.json'
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

describe('customization', () => {
  test('should parse a custom function', () => {
    const options: JSONQueryParseOptions = {
      functions: { customFn: () => () => 42 }
    }

    expect(parse('customFn(.age, "desc")', options)).toEqual(['customFn', ['get', 'age'], 'desc'])

    // built-in functions should still be available
    expect(parse('add(2, 3)', options)).toEqual(['add', 2, 3])
  })

  test('should parse a custom operator without vararg', () => {
    const options: JSONQueryParseOptions = {
      operators: [{ name: 'aboutEq', op: '~=', at: '==' }]
    }

    expect(parse('.score ~= 8', options)).toEqual(['aboutEq', ['get', 'score'], 8])

    // built-in operators should still be available
    expect(parse('.score == 8', options)).toEqual(['eq', ['get', 'score'], 8])

    expect(() => parse('2 ~= 3 ~= 4', options)).toThrow("Unexpected part '~= 4'")
  })

  test('should parse a custom operator with vararg without leftAssociative', () => {
    const options: JSONQueryParseOptions = {
      operators: [{ name: 'aboutEq', op: '~=', at: '==', vararg: true }]
    }

    expect(parse('2 and 3 and 4', options)).toEqual(['and', 2, 3, 4])
    expect(parse('2 ~= 3', options)).toEqual(['aboutEq', 2, 3])
    expect(parse('2 ~= 3 and 4', options)).toEqual(['and', ['aboutEq', 2, 3], 4])
    expect(parse('2 and 3 ~= 4', options)).toEqual(['and', 2, ['aboutEq', 3, 4]])
    expect(parse('2 == 3 ~= 4', options)).toEqual(['aboutEq', ['eq', 2, 3], 4])
    expect(parse('2 ~= 3 == 4', options)).toEqual(['eq', ['aboutEq', 2, 3], 4])
    expect(() => parse('2 ~= 3 ~= 4', options)).toThrow("Unexpected part '~= 4'")
    expect(() => parse('2 == 3 == 4', options)).toThrow("Unexpected part '== 4'")
  })

  test('should parse a custom operator with vararg with leftAssociative', () => {
    const options: JSONQueryParseOptions = {
      operators: [{ name: 'aboutEq', op: '~=', at: '==', vararg: true, leftAssociative: true }]
    }

    expect(parse('2 and 3 and 4', options)).toEqual(['and', 2, 3, 4])
    expect(parse('2 ~= 3', options)).toEqual(['aboutEq', 2, 3])
    expect(parse('2 ~= 3 ~= 4', options)).toEqual(['aboutEq', 2, 3, 4])
    expect(() => parse('2 == 3 == 4', options)).toThrow("Unexpected part '== 4'")
  })

  test('should throw an error in case of an invalid custom operator', () => {
    const options: JSONQueryParseOptions = {
      // @ts-ignore
      operators: [{}]
    }

    expect(() => parse('.score > 8', options)).toThrow('Invalid custom operator')
  })

  test('should throw an error in case of an invalid custom operator (2)', () => {
    const options: JSONQueryParseOptions = {
      // @ts-ignore
      operators: {}
    }

    expect(() => parse('.score > 8', options)).toThrow('Invalid custom operators')
  })
})

describe('test-suite', () => {
  test('should validate the parse test-suite against its JSON schema', () => {
    const ajv = new Ajv({ allErrors: false })
    const valid = ajv.validate(schema, suite)

    expect(ajv.errors).toEqual(null)
    expect(valid).toEqual(true)
  })
})
