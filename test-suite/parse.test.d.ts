import type { JSONQuery } from '../src/types'

export interface ParseTest {
  input: string
  output: JSONQuery
}

export interface ParseTestException {
  input: string
  throws: string
}

export interface ParseTestGroup {
  category: string
  description: string
  tests: Array<ParseTest | ParseTestException>
}

export interface ParseTestSuite {
  updated: string
  groups: ParseTestGroup[]
}
