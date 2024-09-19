import { describe, expect, test } from 'vitest'
import { stringify } from './stringify'
import type { JSONQueryStringifyOptions } from './types'

describe('stringify', () => {
  test('should stringify a function', () => {
    expect(stringify(['sort', ['get', 'age'], 'desc'])).toEqual('sort(.age, "desc")')
    expect(stringify(['filter', ['gt', ['get', 'age'], 18]])).toEqual('filter(.age > 18)')
  })

  test('should stringify a getter', () => {
    expect(stringify(['get', 'age'])).toEqual('.age')
    expect(stringify(['get', 'address', 'city'])).toEqual('.address.city')
    expect(stringify(['get', 'with space'])).toEqual('."with space"')
    expect(stringify(['get', 'with special !'])).toEqual('."with special !"')
  })

  test('should stringify an operator', () => {
    expect(stringify(['add', 2, 3])).toEqual('(2 + 3)')
  })

  test('should stringify an custom operator', () => {
    const options: JSONQueryStringifyOptions = {
      operators: { aboutEq: '~=' }
    }

    expect(stringify(['aboutEq', 2, 3], options)).toEqual('(2 ~= 3)')
    expect(stringify(['filter', ['aboutEq', 2, 3]], options)).toEqual('filter(2 ~= 3)')
    expect(stringify(['object', { result: ['aboutEq', 2, 3] }], options)).toEqual(
      '{ result: (2 ~= 3) }'
    )
    expect(stringify(['eq', 2, 3], options)).toEqual('(2 == 3)')
  })

  test('should stringify a pipe', () => {
    expect(stringify(['pipe', ['get', 'age'], ['average']])).toEqual('.age | average()')
  })

  test('should stringify an object', () => {
    expect(
      stringify(['object', { name: ['get', 'name'], city: ['get', 'address', 'city'] }])
    ).toEqual('{ name: .name, city: .address.city }')
  })

  test('should stringify an array', () => {
    expect(stringify(['array', [1, 2, 3]])).toEqual('[1, 2, 3]')
    expect(stringify(['array', [['add', 1, 2], 4, 5]])).toEqual('[(1 + 2), 4, 5]')
    expect(stringify(['filter', ['in', ['get', 'age'], ['array', [19, 23]]]])).toEqual(
      'filter(.age in [19, 23])'
    )
  })

  test('should stringify a composed query (1)', () => {
    expect(
      stringify(['pipe', ['map', ['multiply', ['get', 'price'], ['get', 'quantity']]], ['sum']])
    ).toEqual('map(.price * .quantity) | sum()')
  })

  test('should stringify a composed query (2)', () => {
    expect(
      stringify([
        'pipe',
        ['get', 'friends'],
        ['filter', ['eq', ['get', 'city'], 'New York']],
        ['sort', ['get', 'age']],
        ['pick', ['get', 'name'], ['get', 'age']]
      ])
    ).toEqual('.friends | filter(.city == "New York") | sort(.age) | pick(.name, .age)')
  })

  test('should stringify a composed query (3)', () => {
    expect(
      stringify(['filter', ['and', ['gte', ['get', 'age'], 23], ['lte', ['get', 'age'], 27]]])
    ).toEqual('filter((.age >= 23) and (.age <= 27))')
  })

  test('should stringify a composed query (4)', () => {
    expect(
      stringify([
        'pipe',
        ['get', 'friends'],
        [
          'object',
          {
            names: ['map', ['get', 'name']],
            count: ['size'],
            averageAge: ['pipe', ['map', ['get', 'age']], ['average']]
          }
        ]
      ])
    ).toEqual('.friends | { names: map(.name), count: size(), averageAge: map(.age) | average() }')
  })

  test('should stringify a composed query (5)', () => {
    expect(
      stringify([
        'object',
        {
          name: ['get', 'name'],
          city: ['get', 'address', 'city'],
          averageAge: ['pipe', ['map', ['get', 'age']], ['average']]
        }
      ])
    ).toEqual('{ name: .name, city: .address.city, averageAge: map(.age) | average() }')
  })
})
