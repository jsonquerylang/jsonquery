import type { JSONQuery, JSONQueryStringifyOptions } from '../src/types'

export interface StringifyTest {
  input: JSONQuery
  output: string
}

export interface StringifyTestGroup {
  category: string
  description: string
  options?: JSONQueryStringifyOptions
  tests: StringifyTest[]
}

export interface StringifyTestSuite {
  updated: string
  groups: StringifyTestGroup[]
}
