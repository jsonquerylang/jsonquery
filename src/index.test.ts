import { describe, expect, test } from 'vitest'
import { buildFunction, compile, jsonquery, parse, stringify } from './index'

describe('index', () => {
  test('have exported all documented functions', () => {
    expect(jsonquery).toBeTypeOf('function')
    expect(parse).toBeTypeOf('function')
    expect(stringify).toBeTypeOf('function')
    expect(compile).toBeTypeOf('function')
    expect(buildFunction).toBeTypeOf('function')
  })
})
