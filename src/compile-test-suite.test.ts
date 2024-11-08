import { describe, expect, test } from 'vitest'
import suite from '../test-suite/compile.json' with { type: 'json' }
import { compile } from './compile'
import type { JSONQuery } from './types'

interface DataTest {
  category: string
  description: string
  data: unknown
  query: JSONQuery
  output: unknown
}

interface DataRefTest {
  category: string
  description: string
  dataRef: string
  query: JSONQuery
  output: unknown
}

interface CompileTestSuite {
  updated: string
  dataRefs: Record<string, unknown>
  tests: Array<DataTest | DataRefTest>
}

function isDataRefTest(test: unknown): test is DataRefTest {
  return test && typeof (test as Record<string, unknown>).dataRef === 'string'
}

const groupByCategory = compile(['groupBy', ['get', 'category']])
const testsByCategory = groupByCategory(suite.tests) as Record<string, CompileTestSuite['tests']>

for (const [category, tests] of Object.entries(testsByCategory)) {
  describe(category, () => {
    for (const currentTest of tests) {
      if (isDataRefTest(currentTest)) {
        const { description, dataRef, query, output } = currentTest

        test(description, () => {
          const resolvedData = suite.dataRefs[dataRef]
          const actualOutput = compile(query)(resolvedData)

          expect({ dataRef, query, output: actualOutput }).toEqual({ dataRef, query, output })
        })
      } else {
        const { description, data, query, output } = currentTest

        test(description, () => {
          const actualOutput = compile(query)(data)

          expect({ data, query, output: actualOutput }).toEqual({ data, query, output })
        })
      }
    }
  })
}
