import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import type { StringifyTestSuite } from '../test-suite/stringify.test'
import suite from '../test-suite/stringify.test.json'
import schema from '../test-suite/stringify.test.schema.json'
import { compile } from './compile'
import { stringify } from './stringify'
import type { JSONQueryStringifyOptions } from './types'

const groupByCategory = compile(['groupBy', ['get', 'category']])
const testsByCategory = groupByCategory(suite.groups) as Record<
  string,
  StringifyTestSuite['groups']
>

for (const [category, testGroups] of Object.entries(testsByCategory)) {
  describe(category, () => {
    for (const group of testGroups) {
      describe(group.description, () => {
        for (const currentTest of group.tests) {
          const description = `input = ${JSON.stringify(currentTest.input)}`

          test(description, () => {
            const { input, output } = currentTest

            expect(stringify(input, group.options)).toEqual(output)
          })
        }
      })
    }
  })
}

describe('customization', () => {
  test('should stringify a custom operator', () => {
    const options: JSONQueryStringifyOptions = {
      operators: [{ name: 'aboutEq', op: '~=', at: '==' }]
    }

    expect(stringify(['aboutEq', 2, 3], options)).toEqual('2 ~= 3')
    expect(stringify(['filter', ['aboutEq', 2, 3]], options)).toEqual('filter(2 ~= 3)')
    expect(stringify(['object', { result: ['aboutEq', 2, 3] }], options)).toEqual(
      '{ result: 2 ~= 3 }'
    )
    // existing operators should still be there
    expect(stringify(['eq', 2, 3], options)).toEqual('2 == 3')

    // test precedence and parenthesis
    expect(stringify(['aboutEq', ['aboutEq', 2, 3], 4], options)).toEqual('(2 ~= 3) ~= 4')
    expect(stringify(['aboutEq', 2, ['aboutEq', 3, 4]], options)).toEqual('2 ~= (3 ~= 4)')
    expect(stringify(['aboutEq', ['and', 2, 3], 4], options)).toEqual('(2 and 3) ~= 4')
    expect(stringify(['aboutEq', 2, ['and', 3, 4]], options)).toEqual('2 ~= (3 and 4)')
    expect(stringify(['and', ['aboutEq', 2, 3], 4], options)).toEqual('2 ~= 3 and 4')
    expect(stringify(['and', 2, ['aboutEq', 3, 4]], options)).toEqual('2 and 3 ~= 4')
    expect(stringify(['aboutEq', ['add', 2, 3], 4], options)).toEqual('2 + 3 ~= 4')
    expect(stringify(['aboutEq', 2, ['add', 3, 4]], options)).toEqual('2 ~= 3 + 4')
    expect(stringify(['add', ['aboutEq', 2, 3], 4], options)).toEqual('(2 ~= 3) + 4')
    expect(stringify(['add', 2, ['aboutEq', 3, 4]], options)).toEqual('2 + (3 ~= 4)')
  })

  test('should stringify a custom operator which is leftAssociative', () => {
    const options: JSONQueryStringifyOptions = {
      operators: [{ name: 'aboutEq', op: '~=', at: '==', leftAssociative: true }]
    }

    expect(stringify(['aboutEq', ['aboutEq', 2, 3], 4], options)).toEqual('2 ~= 3 ~= 4')
    expect(stringify(['aboutEq', 2, ['aboutEq', 3, 4]], options)).toEqual('2 ~= (3 ~= 4)')
  })

  // Note: we do not test the option `CustomOperator.vararg`
  // since they have no effect on stringification, only on parsing.
})

describe('test-suite', () => {
  test('should validate the stringify test-suite against its JSON schema', () => {
    const ajv = new Ajv({ allErrors: false })
    const valid = ajv.validate(schema, suite)

    expect(ajv.errors).toEqual(null)
    expect(valid).toEqual(true)
  })
})
