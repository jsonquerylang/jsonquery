import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import type { CompileTestException, CompileTestSuite } from '../test-suite/compile.test'
import suite from '../test-suite/compile.test.json'
import schema from '../test-suite/compile.test.schema.json'
import { compile } from './compile'
import { buildFunction } from './functions'
import type { JSONQuery, JSONQueryCompileOptions } from './types'

function isTestException(test: unknown): test is CompileTestException {
  return !!test && typeof (test as Record<string, unknown>).throws === 'string'
}

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

/**
 * Compile and execute
 */
function go(data: unknown, query: JSONQuery, options?: JSONQueryCompileOptions) {
  const exec = compile(query, options)
  return exec(data)
}

const groupByCategory = compile(['groupBy', ['get', 'category']])
const testsByCategory = groupByCategory(suite.groups) as Record<string, CompileTestSuite['groups']>

for (const [category, testGroups] of Object.entries(testsByCategory)) {
  describe(category, () => {
    for (const group of testGroups) {
      describe(group.description, () => {
        for (const currentTest of group.tests) {
          const description = `input=${JSON.stringify(currentTest.input)}, query=${JSON.stringify(currentTest.query)}`

          if (isTestException(currentTest)) {
            test(description, () => {
              const { input, query, throws } = currentTest

              expect(() => compile(query)(input)).toThrow(throws)
            })
          } else {
            test(description, () => {
              const { input, query, output } = currentTest
              const actualOutput = compile(query)(input)

              expect({ input, query, output: actualOutput }).toEqual({ input, query, output })
            })
          }
        }
      })
    }
  })
}

describe('error handling', () => {
  test('should throw a helpful error when a pipe contains a compile time error', () => {
    let actualErr = undefined
    try {
      go(data, ['foo', 42])
    } catch (err) {
      actualErr = err
    }

    expect(actualErr?.message).toBe("Unknown function 'foo'")
  })

  test('should throw a helpful error when passing an object {...} instead of function ["object", {...}]', () => {
    let actualErr = undefined
    const user = { name: 'Joe' }
    const query: JSONQuery = { name: ['get', 'name'] }
    try {
      go(user, query)
    } catch (err) {
      actualErr = err
    }

    expect(actualErr?.message).toBe(
      'Function notation ["object", {...}] expected but got {"name":["get","name"]}'
    )
  })

  test('should throw a helpful error when a pipe contains a runtime error', () => {
    const scoreData = {
      participants: [
        { name: 'Chris', age: 23, scores: [7.2, 5, 8.0] },
        { name: 'Emily', age: 19 },
        { name: 'Joe', age: 32, scores: [6.1, 8.1] }
      ]
    }
    const query: JSONQuery = [
      'pipe',
      ['get', 'participants'],
      ['map', ['pipe', ['get', 'scores'], ['map', ['round']], ['sum']]]
    ]

    let actualErr = undefined
    try {
      go(scoreData, query)
    } catch (err) {
      actualErr = err
    }

    expect(actualErr?.message).toBe("Cannot read properties of null (reading 'map')")
    expect(actualErr?.jsonquery).toEqual([
      { data: scoreData, query },
      {
        data: scoreData.participants,
        query: ['map', ['pipe', ['get', 'scores'], ['map', ['round']], ['sum']]]
      },
      {
        data: { name: 'Emily', age: 19 },
        query: ['pipe', ['get', 'scores'], ['map', ['round']], ['sum']]
      },
      { data: null, query: ['map', ['round']] }
    ])
  })
})

describe('customization', () => {
  test('should extend with a custom function "times"', () => {
    const options = {
      functions: {
        times: (value: number) => (data: number[]) => data.map((item) => item * value)
      }
    }

    expect(go([1, 2, 3], ['times', 2], options)).toEqual([2, 4, 6])
    expect(() => go([1, 2, 3], ['times', 2])).toThrow("Unknown function 'times'")
  })

  test('should extend with a custom function with more than 2 arguments', () => {
    const options = {
      functions: {
        oneOf: buildFunction(
          (value: unknown, a: unknown, b: unknown, c: unknown) =>
            value === a || value === b || value === c
        )
      }
    }

    expect(go('C', ['oneOf', ['get'], 'A', 'B', 'C'], options)).toEqual(true)
    expect(go('D', ['oneOf', ['get'], 'A', 'B', 'C'], options)).toEqual(false)
  })

  test('should override an existing function', () => {
    const options = {
      functions: {
        sort: () => (_data: unknown[]) => 'custom sort'
      }
    }

    expect(go([2, 3, 1], ['sort'], options)).toEqual('custom sort')
  })

  test('should be able to insert a function in a nested compile', () => {
    const options = {
      functions: {
        times: (value: JSONQuery) => {
          const _options = {
            functions: {
              foo: () => (_data: unknown) => 42
            }
          }
          const _value = compile(value, _options)

          return (data: number[]) => data.map((item) => item * (_value(data) as number))
        }
      }
    }

    expect(go([1, 2, 3], ['times', 2], options)).toEqual([2, 4, 6])
    expect(go([1, 2, 3], ['times', ['foo']], options)).toEqual([42, 84, 126])

    // The function `foo` must not be available outside the `times` function
    expect(() => go([1, 2, 3], ['foo'], options)).toThrow("Unknown function 'foo'")
  })

  test('should cleanup the custom function stack when creating a query throws an error', () => {
    const options = {
      functions: {
        sort: () => {
          throw new Error('Test Error')
        }
      }
    }

    expect(() => go({}, ['sort'], options)).toThrow('Test Error')

    expect(go([2, 3, 1], ['sort'])).toEqual([1, 2, 3])
  })

  test('should extend with a custom function aboutEq', () => {
    const options = {
      functions: {
        // biome-ignore lint/suspicious/noDoubleEquals: we want to test loosely equal here
        aboutEq: buildFunction((a, b) => a == b) // loosely equal
      }
    }

    expect(go({ a: 2 }, ['aboutEq', ['get', 'a'], 2], options)).toEqual(true)
    expect(go({ a: 2 }, ['aboutEq', ['get', 'a'], '2'], options)).toEqual(true)
  })
})

test('should validate the compile test-suite against its JSON schema', () => {
  const ajv = new Ajv({ allErrors: false })
  const valid = ajv.validate(schema, suite)

  expect(ajv.errors).toEqual(null)
  expect(valid).toEqual(true)
})
