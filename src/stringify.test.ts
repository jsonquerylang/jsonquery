import Ajv from 'ajv'
import { describe, expect, test } from 'vitest'
import type { StringifyTestSuite } from '../test-suite/stringify.test'
import suite from '../test-suite/stringify.test.json'
import schema from '../test-suite/stringify.test.schema.json'
import { compile } from './compile'
import { stringify } from './stringify'

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

describe('test-suite', () => {
  test('should validate the stringify test-suite against its JSON schema', () => {
    const ajv = new Ajv({ allErrors: false })
    const valid = ajv.validate(schema, suite)

    expect(ajv.errors).toEqual(null)
    expect(valid).toEqual(true)
  })
})
