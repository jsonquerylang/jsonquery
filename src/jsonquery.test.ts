import { describe, expect, test } from 'vitest'
import { buildFunction, compile, jsonquery, parse, stringify } from './jsonquery'

describe('jsonquery', () => {
  test('should execute a JSON query', () => {
    expect(jsonquery({ name: 'Joe' }, ['get', 'name'])).toEqual('Joe')
  })

  test('should execute a text query', () => {
    expect(jsonquery({ name: 'Joe' }, '.name')).toEqual('Joe')
  })

  test('should execute a JSON query with custom functions', () => {
    const functions = {
      customFn: () => (_data: unknown) => 42
    }

    expect(jsonquery({}, ['customFn'], { functions })).toEqual(42)
  })

  test('should execute a text query with custom functions', () => {
    const functions = {
      customFn: () => (_data: unknown) => 42
    }

    expect(jsonquery({ name: 'Joe' }, '.name', { functions })).toEqual('Joe')
  })

  test('should execute a JSON query with custom operators', () => {
    const operators = {
      aboutEq: '~='
    }

    expect(jsonquery({ name: 'Joe' }, ['get', 'name'], { operators })).toEqual('Joe')
  })

  test('should execute a text query with custom operators', () => {
    const operators = {
      aboutEq: '~='
    }

    expect(jsonquery({ name: 'Joe' }, '.name', { operators })).toEqual('Joe')
  })

  test('have exported all documented functions', () => {
    expect(jsonquery).toBeTypeOf('function')
    expect(parse).toBeTypeOf('function')
    expect(stringify).toBeTypeOf('function')
    expect(compile).toBeTypeOf('function')
    expect(buildFunction).toBeTypeOf('function')
  })
})
