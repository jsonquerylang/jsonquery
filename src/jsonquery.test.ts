import { describe, expect, test } from 'vitest'
import {
  type JSONQuery,
  type JSONQueryOptions,
  buildFunction,
  compile,
  jsonquery,
  operators,
  parse,
  stringify
} from './jsonquery'

describe('jsonquery', () => {
  test('should execute a JSON query', () => {
    const query: JSONQuery = ['get', 'name']
    expect(jsonquery({ name: 'Joe' }, query)).toEqual('Joe')
  })

  test('should execute a text query', () => {
    expect(jsonquery({ name: 'Joe' }, '.name')).toEqual('Joe')
  })

  test('should execute a JSON query with custom functions', () => {
    const options: JSONQueryOptions = {
      functions: {
        customFn: () => (_data: unknown) => 42
      }
    }

    expect(jsonquery({}, ['customFn'], options)).toEqual(42)
  })

  test('should execute a text query with custom functions', () => {
    const options: JSONQueryOptions = {
      functions: {
        customFn: () => (_data: unknown) => 42
      }
    }

    expect(jsonquery({ name: 'Joe' }, '.name', options)).toEqual('Joe')
  })

  test('should execute a JSON query with custom operators', () => {
    const options: JSONQueryOptions = {
      functions: {
        aboutEq: buildFunction((a: string, b: string) => a.toLowerCase() === b.toLowerCase())
      }
    }

    expect(jsonquery({ name: 'Joe' }, ['aboutEq', ['get', 'name'], 'joe'], options)).toEqual(true)
  })

  test('should execute a text query with custom operators', () => {
    const options: JSONQueryOptions = {
      operators: operators.map((ops) => {
        return Object.values(ops).includes('==') ? { ...ops, aboutEq: '~=' } : ops
      }),
      functions: {
        aboutEq: buildFunction((a: string, b: string) => a.toLowerCase() === b.toLowerCase())
      }
    }

    expect(jsonquery({ name: 'Joe' }, '.name ~= "joe"', options)).toEqual(true)
  })

  test('have exported all documented functions', () => {
    expect(jsonquery).toBeTypeOf('function')
    expect(parse).toBeTypeOf('function')
    expect(stringify).toBeTypeOf('function')
    expect(compile).toBeTypeOf('function')
    expect(buildFunction).toBeTypeOf('function')
  })
})
