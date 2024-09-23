import { describe, expect, test } from 'vitest'
import { stringify } from './stringify'
import type { JSONQueryStringifyOptions } from './types'

describe('stringify', () => {
  test('should stringify a function', () => {
    expect(stringify(['sort', ['get', 'age'], 'desc'])).toEqual('sort(.age, "desc")')
    expect(stringify(['filter', ['gt', ['get', 'age'], 18]])).toEqual('filter(.age > 18)')
  })

  test('should stringify a function with indentation', () => {
    expect(stringify(['sort', ['get', 'age'], 'desc'], { maxLineLength: 4 })).toEqual(
      'sort(\n  .age,\n  "desc"\n)'
    )
  })

  test('should stringify a nested function with indentation', () => {
    expect(
      stringify(['object', { sorted: ['sort', ['get', 'age'], 'desc'] }], { maxLineLength: 4 })
    ).toEqual('{\n  sorted: sort(\n    .age,\n    "desc"\n  )\n}')
  })

  test('should stringify a nested function having one argument with indentation', () => {
    expect(
      stringify(['map', ['object', { name: ['get', 'name'], city: ['get', 'address', 'city'] }]], {
        maxLineLength: 4
      })
    ).toEqual('map({\n  name: .name,\n  city: .address.city\n})')
  })

  test('should stringify a property', () => {
    expect(stringify(['get'])).toEqual('get()')
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

  test('should stringify a pipe with indentation', () => {
    expect(stringify(['pipe', ['get', 'age'], ['average']], { maxLineLength: 10 })).toEqual(
      '.age\n  | average()'
    )
  })

  test('should stringify a nested pipe with indentation', () => {
    const query = ['object', { nested: ['pipe', ['get', 'age'], ['average']] }]
    expect(stringify(query, { maxLineLength: 10 })).toEqual('{\n  nested: .age\n    | average()\n}')
  })

  test('should stringify an object', () => {
    expect(
      stringify(['object', { name: ['get', 'name'], city: ['get', 'address', 'city'] }])
    ).toEqual('{ name: .name, city: .address.city }')
  })

  test('should stringify an object with indentation', () => {
    const query = ['object', { name: ['get', 'name'], city: ['get', 'address', 'city'] }]

    expect(stringify(query, { maxLineLength: 20 })).toEqual(
      '{\n  name: .name,\n  city: .address.city\n}'
    )
  })

  test('should stringify a nested object with indentation', () => {
    const query = [
      'object',
      {
        name: ['get', 'name'],
        address: [
          'object',
          {
            city: ['get', 'city'],
            street: ['get', 'street']
          }
        ]
      }
    ]

    expect(stringify(query, { maxLineLength: 4 })).toEqual(
      '{\n  name: .name,\n  address: {\n    city: .city,\n    street: .street\n  }\n}'
    )
  })

  test('should stringify an object with custom indentation', () => {
    const query = ['object', { name: ['get', 'name'], city: ['get', 'address', 'city'] }]

    expect(stringify(query, { maxLineLength: 20, indentation: '    ' })).toEqual(
      '{\n    name: .name,\n    city: .address.city\n}'
    )

    expect(stringify(query, { maxLineLength: 20, indentation: '\t' })).toEqual(
      '{\n\tname: .name,\n\tcity: .address.city\n}'
    )
  })

  test('should stringify an array', () => {
    expect(stringify(['array', 1, 2, 3])).toEqual('[1, 2, 3]')
    expect(stringify(['array', ['add', 1, 2], 4, 5])).toEqual('[(1 + 2), 4, 5]')
    expect(stringify(['filter', ['in', ['get', 'age'], ['array', 19, 23]]])).toEqual(
      'filter(.age in [19, 23])'
    )
  })

  test('should stringify an array with indentation', () => {
    expect(stringify(['array', 1, 2, 3], { maxLineLength: 4 })).toEqual('[\n  1,\n  2,\n  3\n]')
  })

  test('should stringify a nested array with indentation', () => {
    expect(stringify(['object', { array: ['array', 1, 2, 3] }], { maxLineLength: 4 })).toEqual(
      '{\n  array: [\n    1,\n    2,\n    3\n  ]\n}'
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
    ).toEqual(`.friends
  | filter(.city == "New York")
  | sort(.age)
  | pick(.name, .age)`)
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
    ).toEqual(
      '.friends\n  | {\n    names: map(.name),\n    count: size(),\n    averageAge: map(.age) | average()\n  }'
    )
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
    ).toEqual('{\n  name: .name,\n  city: .address.city,\n  averageAge: map(.age) | average()\n}')
  })
})
