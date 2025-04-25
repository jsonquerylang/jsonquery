import type { JSONQuery } from '../src/types'

export interface CompileTestOutput {
  category: string
  description: string
  input: unknown
  query: JSONQuery
  output: unknown
}

export interface CompileTestException {
  category: string
  description: string
  input: unknown
  query: JSONQuery
  throws: string
}

export type CompileTest = CompileTestOutput | CompileTestException

export interface CompileTestSuite {
  updated: string
  tests: CompileTest[]
}
