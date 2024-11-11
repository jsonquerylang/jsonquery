import type { JSONQuery } from '../src/types'

export interface CompileTest {
  category: string
  description: string
  data: unknown
  query: JSONQuery
  output: unknown
}

export interface CompileTestSuite {
  updated: string
  tests: CompileTest[]
}
