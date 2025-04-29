import type { JSONQuery } from '../src/types'

export interface CompileTestOutput {
  input: unknown
  query: JSONQuery
  output: unknown
}

export interface CompileTestException {
  input: unknown
  query: JSONQuery
  throws: string
}

export interface CompileTestGroup {
  category: string
  description: string
  tests: Array<CompileTestOutput | CompileTestException>
}

export interface CompileTestSuite {
  updated: string
  groups: CompileTestGroup[]
}
