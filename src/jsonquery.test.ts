import { describe, expect, test } from 'vitest'
import { jsonquery } from './jsonquery.js'

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

const friendsData = {
  friends: data
}

const nestedData = [
  { name: 'Chris', age: 23, address: { city: 'New York' } },
  { name: 'Emily', age: 19, address: { city: 'Atlanta' } },
  { name: 'Joe', age: 32, address: { city: 'New York' } },
  { name: 'Kevin', age: 19, address: { city: 'Atlanta' } },
  { name: 'Michelle', age: 27, address: { city: 'Los Angeles' } },
  { name: 'Robert', age: 45, address: { city: 'Manhattan' } },
  { name: 'Sarah', age: 31, address: { city: 'New York' } }
]

const scoresData = [
  { name: 'Chris', scores: [5, 7, 3] },
  { name: 'Emily', scores: [8, 5, 2, 5] },
  { name: 'Joe', scores: [1, 1, 5, 6] }
]

describe('jsonquery', () => {
  test('should execute a function', () => {
    expect(jsonquery({ name: 'Joe' }, ['get', 'name'])).toEqual('Joe')
  })

  test('should execute an operator', () => {
    expect(jsonquery({ a: 2, b: 3 }, ['a', '==', 2])).toEqual(true)
    expect(jsonquery({ a: 2, b: 3 }, ['a', '==', 3])).toEqual(false)
    expect(jsonquery({ a: 2, b: 3 }, ['a', '<', ['get', 'b']])).toEqual(true)
    expect(jsonquery({ a: 2, b: 3 }, [2, '==', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: 2, b: 3 }, [2, '==', ['get', 'a']])).toEqual(true)
    // expect(jsonquery({ a: 2, b: 3 }, ['a', '<', ['b']])).toEqual(true) // FIXME
    expect(jsonquery({ a: 2, b: 3 }, [['a', '==', 2], 'and', ['b', '==', 3]])).toEqual(true)
    expect(jsonquery({ a: 2, b: 3 }, [['a', '==', 3], 'and', ['b', '==', 3]])).toEqual(false)
    expect(jsonquery({ a: 2, b: 3 }, [['a', '==', 2], 'and', ['b', '==', 4]])).toEqual(false)
    expect(jsonquery({ a: 2, b: 3 }, [['a', '==', 2], 'or', ['b', '==', 4]])).toEqual(true)
    expect(jsonquery({ a: 2, b: 3 }, [['a', '==', 1], 'or', ['b', '==', 4]])).toEqual(false)
    expect(jsonquery({ message: 'hello' }, ['message', '==', 'hello'])).toEqual(true)
    expect(jsonquery({ message: 'hello' }, [['value', 'hello'], '==', ['get', 'message']])).toEqual(
      true
    )
  })

  test('should execute a pipeline', () => {
    expect(
      jsonquery({ user: { name: 'Joe' } }, [
        ['get', 'user'],
        ['get', 'name']
      ])
    ).toEqual('Joe')
  })

  test('should create an object', () => {
    expect(
      jsonquery(data, {
        names: ['get', 'name'],
        count: ['size'],
        averageAge: [['get', 'age'], ['average']]
      })
    ).toEqual({
      names: ['Chris', 'Emily', 'Joe', 'Kevin', 'Michelle', 'Robert', 'Sarah'],
      count: 7,
      averageAge: 28
    })
  })

  test('should create a nested object', () => {
    expect(
      jsonquery(data, {
        names: ['get', 'name'],
        stats: {
          count: ['size'],
          averageAge: [['get', 'age'], ['average']]
        }
      })
    ).toEqual({
      names: ['Chris', 'Emily', 'Joe', 'Kevin', 'Michelle', 'Robert', 'Sarah'],
      stats: {
        count: 7,
        averageAge: 28
      }
    })
  })

  test('should map over an array', () => {
    expect(
      jsonquery(scoresData, [
        [
          'map',
          {
            name: ['get', 'name'],
            maxScore: [['get', 'scores'], ['max']],
            minScore: [['get', 'scores'], ['min']]
          }
        ],
        ['sort', 'maxScore', 'desc']
      ])
    ).toEqual([
      { name: 'Emily', maxScore: 8, minScore: 2 },
      { name: 'Chris', maxScore: 7, minScore: 3 },
      { name: 'Joe', maxScore: 6, minScore: 1 }
    ])
  })

  test('should map over an array using pick', () => {
    expect(jsonquery(data, ['map', ['pick', 'name']])).toEqual([
      { name: 'Chris' },
      { name: 'Emily' },
      { name: 'Joe' },
      { name: 'Kevin' },
      { name: 'Michelle' },
      { name: 'Robert' },
      { name: 'Sarah' }
    ])
  })

  test('should flatten an array', () => {
    expect(
      jsonquery(
        [
          [1, 2],
          [3, 4, 5]
        ],
        ['flatten']
      )
    ).toEqual([1, 2, 3, 4, 5])
  })

  test('should filter data using ==', () => {
    expect(jsonquery(data, ['filter', 'city', '==', 'New York'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should filter nested data using ==', () => {
    expect(jsonquery(nestedData, ['filter', ['address', 'city'], '==', 'New York'])).toEqual([
      { name: 'Chris', age: 23, address: { city: 'New York' } },
      { name: 'Joe', age: 32, address: { city: 'New York' } },
      { name: 'Sarah', age: 31, address: { city: 'New York' } }
    ])
  })

  test('should filter data using !=', () => {
    expect(jsonquery(data, ['filter', 'city', '!=', 'New York'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should filter data using >', () => {
    expect(jsonquery(data, ['filter', 'age', '>', 45])).toEqual([])
  })

  test('should filter data using >=', () => {
    expect(jsonquery(data, ['filter', 'age', '>=', 45])).toEqual([
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should filter data using <', () => {
    expect(jsonquery(data, ['filter', 'age', '<', 19])).toEqual([])
  })

  test('should filter data using <=', () => {
    expect(jsonquery(data, ['filter', 'age', '<=', 19])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should filter data using >= and <=', () => {
    expect(
      jsonquery(data, [
        ['filter', 'age', '>=', 23],
        ['filter', 'age', '<=', 27]
      ])
    ).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' }
    ])
  })

  test('should filter data using "in"', () => {
    expect(jsonquery(data, ['filter', 'age', 'in', [19, 23]])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should filter data using "not in"', () => {
    expect(jsonquery(data, ['filter', 'age', 'not in', [19, 23]])).toEqual([
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should filter data using "regex"', () => {
    // search for a name containing 3 to 5 letters
    expect(jsonquery(data, ['filter', 'name', 'regex', '^[A-z]{3,5}$'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test.skip('should filter data using "regex" with flags', () => {
    // search for a name containing a case-insensitive character "m"
    expect(jsonquery(data, ['filter', 'name', 'regex', 'm', 'i'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' }
    ])
  })

  test('should sort data (default direction)', () => {
    expect(jsonquery(data, ['sort', 'age'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Sarah', age: 31, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should sort data (asc)', () => {
    expect(jsonquery(data, ['sort', 'age', 'asc'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Sarah', age: 31, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should sort data (desc)', () => {
    expect(jsonquery(data, ['sort', 'age', 'desc'])).toEqual([
      { name: 'Robert', age: 45, city: 'Manhattan' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Sarah', age: 31, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should sort data (strings)', () => {
    expect(jsonquery(data, ['sort', 'name'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should sort nested data', () => {
    expect(jsonquery(nestedData, ['sort', ['address', 'city']])).toEqual([
      { name: 'Emily', age: 19, address: { city: 'Atlanta' } },
      { name: 'Kevin', age: 19, address: { city: 'Atlanta' } },
      { name: 'Michelle', age: 27, address: { city: 'Los Angeles' } },
      { name: 'Robert', age: 45, address: { city: 'Manhattan' } },
      { name: 'Chris', age: 23, address: { city: 'New York' } },
      { name: 'Joe', age: 32, address: { city: 'New York' } },
      { name: 'Sarah', age: 31, address: { city: 'New York' } }
    ])
  })

  test('should sort a list with numbers rather than objects', () => {
    expect(jsonquery([3, 7, 2, 6], ['sort'])).toEqual([2, 3, 6, 7])
  })

  test('should not crash when sorting a list with nested arrays', () => {
    expect(jsonquery([[3], [7], [4]], ['sort'])).toEqual([[3], [4], [7]])
    expect(jsonquery([[], [], []], ['sort'])).toEqual([[], [], []])
  })

  test('should not crash when sorting a list with nested objects', () => {
    expect(jsonquery([{ a: 1 }, { c: 3 }, { b: 2 }], ['sort'])).toEqual([
      { a: 1 },
      { c: 3 },
      { b: 2 }
    ])
    expect(jsonquery([{}, {}, {}], ['sort'])).toEqual([{}, {}, {}])
  })

  test('should pick data (single field)', () => {
    expect(jsonquery(data, ['pick', 'name'])).toEqual([
      { name: 'Chris' },
      { name: 'Emily' },
      { name: 'Joe' },
      { name: 'Kevin' },
      { name: 'Michelle' },
      { name: 'Robert' },
      { name: 'Sarah' }
    ])
  })

  test('should pick data from an object', () => {
    expect(jsonquery({ a: 1, b: 2, c: 3 }, ['pick', 'b'])).toEqual({ b: 2 })
    expect(jsonquery({ a: 1, b: 2, c: 3 }, ['pick', 'b', 'a'])).toEqual({ b: 2, a: 1 })
  })

  test('should pick data (multiple fields)', () => {
    expect(jsonquery(data, ['pick', 'name', 'city'])).toEqual([
      { name: 'Chris', city: 'New York' },
      { name: 'Emily', city: 'Atlanta' },
      { name: 'Joe', city: 'New York' },
      { name: 'Kevin', city: 'Atlanta' },
      { name: 'Michelle', city: 'Los Angeles' },
      { name: 'Robert', city: 'Manhattan' },
      { name: 'Sarah', city: 'New York' }
    ])
  })

  test('should pick data (a single nested field)', () => {
    expect(jsonquery(nestedData, ['pick', ['address', 'city']])).toEqual([
      { city: 'New York' },
      { city: 'Atlanta' },
      { city: 'New York' },
      { city: 'Atlanta' },
      { city: 'Los Angeles' },
      { city: 'Manhattan' },
      { city: 'New York' }
    ])
  })

  test('should pick data (multiple fields with nested fields)', () => {
    expect(jsonquery(nestedData, ['pick', 'name', ['address', 'city']])).toEqual([
      { name: 'Chris', city: 'New York' },
      { name: 'Emily', city: 'Atlanta' },
      { name: 'Joe', city: 'New York' },
      { name: 'Kevin', city: 'Atlanta' },
      { name: 'Michelle', city: 'Los Angeles' },
      { name: 'Robert', city: 'Manhattan' },
      { name: 'Sarah', city: 'New York' }
    ])
  })

  test('should group items by a key', () => {
    expect(jsonquery(data, ['groupBy', 'city'])).toEqual({
      'New York': [
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Joe', age: 32, city: 'New York' },
        { name: 'Sarah', age: 31, city: 'New York' }
      ],
      Atlanta: [
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Kevin', age: 19, city: 'Atlanta' }
      ],
      'Los Angeles': [{ name: 'Michelle', age: 27, city: 'Los Angeles' }],
      Manhattan: [{ name: 'Robert', age: 45, city: 'Manhattan' }]
    })
  })

  test('should turn an array in an object by key', () => {
    const users = [
      { id: 1, name: 'Joe' },
      { id: 2, name: 'Sarah' },
      { id: 3, name: 'Chris' }
    ]

    expect(jsonquery(users, ['keyBy', 'id'])).toEqual({
      1: { id: 1, name: 'Joe' },
      2: { id: 2, name: 'Sarah' },
      3: { id: 3, name: 'Chris' }
    })
  })

  test('should get nested data from an object', () => {
    expect(jsonquery(friendsData, [['get', 'friends']])).toEqual(data)
  })

  test('should get nested data from an array with objects', () => {
    expect(jsonquery(nestedData, ['get', ['address', 'city']])).toEqual([
      'New York',
      'Atlanta',
      'New York',
      'Atlanta',
      'Los Angeles',
      'Manhattan',
      'New York'
    ])
  })

  test('should get unique values from a list', () => {
    expect(jsonquery([2, 3, 2, 7, 1, 1], ['uniq'])).toEqual([2, 3, 7, 1])
  })

  test('should get unique objects by key', () => {
    expect(jsonquery(data, ['uniqBy', 'city'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should calculate the sum', () => {
    expect(jsonquery([2, 3, 2, 7, 1, 1], ['sum'])).toEqual(16)
  })

  test('should round a value', () => {
    expect(jsonquery(23.1345, ['round'])).toEqual(23)
    expect(jsonquery(23.1345, ['round', 2])).toEqual(23.13)
    expect(jsonquery(23.1345, ['round', 3])).toEqual(23.135)
    expect(jsonquery(23.761, ['round'])).toEqual(24)
  })

  test('should round an array with values', () => {
    expect(jsonquery([2.24, 3.77, 4.49], ['round'])).toEqual([2, 4, 4])
    expect(jsonquery([2.24, 3.77, 4.49], ['round', 1])).toEqual([2.2, 3.8, 4.5])
  })

  test('should calculate the product', () => {
    expect(jsonquery([2, 3, 2, 7, 1, 1], ['prod'])).toEqual(84)
  })

  test('should calculate the average', () => {
    expect(jsonquery([2, 3, 2, 7, 1], ['average'])).toEqual(3)
  })

  test('should count the size of an array', () => {
    expect(jsonquery([], ['size'])).toEqual(0)
    expect(jsonquery([1, 2, 3], ['size'])).toEqual(3)
    expect(jsonquery([1, 2, 3, 4, 5], ['size'])).toEqual(5)
  })

  test('should extract the keys of an object', () => {
    expect(jsonquery({ a: 2, b: 3 }, ['keys'])).toEqual(['a', 'b'])
  })

  test('should extract the values of an object', () => {
    expect(jsonquery({ a: 2, b: 3 }, ['values'])).toEqual([2, 3])
  })

  test('should limit data', () => {
    expect(jsonquery(data, ['limit', 2])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' }
    ])
  })

  test('should process multiple operations', () => {
    expect(
      jsonquery(friendsData, [
        ['get', 'friends'],
        ['filter', 'city', '==', 'New York'],
        ['sort', 'age'],
        ['get', 'name'],
        ['limit', 2]
      ])
    ).toEqual(['Chris', 'Sarah'])
  })

  test('should extend with a custom function "times"', () => {
    const customFunctions = {
      times: (data: number[], value: number) => data.map((item) => item * value)
    }

    expect(jsonquery([1, 2, 3], ['times', 2], customFunctions)).toEqual([2, 4, 6])
  })

  test('should override an existing function', () => {
    const customFunctions = {
      sort: (_data: unknown[]) => 'custom sort'
    }

    expect(jsonquery([2, 3, 1], ['sort'], customFunctions)).toEqual('custom sort')
  })

  test('should be able to query the jmespath example', () => {
    const customFunctions = {
      join: (data: unknown[], separator = ', ') => data.join(separator)
    }

    const data = {
      locations: [
        { name: 'Seattle', state: 'WA' },
        { name: 'New York', state: 'NY' },
        { name: 'Bellevue', state: 'WA' },
        { name: 'Olympia', state: 'WA' }
      ]
    }

    // locations[?state == 'WA'].name | sort(@) | {WashingtonCities: join(', ', @)}
    expect(
      jsonquery(
        data,
        [
          ['get', 'locations'],
          ['filter', 'state', '==', 'WA'],
          ['get', 'name'],
          ['sort'],
          { WashingtonCities: ['join'] }
        ],
        customFunctions
      )
    ).toEqual({
      WashingtonCities: 'Bellevue, Olympia, Seattle'
    })
  })
})
