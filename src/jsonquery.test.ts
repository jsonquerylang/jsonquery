import { describe, expect, test } from 'vitest'
import { jsonquery } from './jsonquery.js'
import { JSONQuery } from './types'
import { compile } from './compile'
import { buildFunction } from './buildFunction'

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
  describe('prop', () => {
    test('should get a path with a single property as string', () => {
      expect(jsonquery({ name: 'Joe' }, ['get', 'name'])).toEqual('Joe')
    })

    test('should get the full object itself', () => {
      expect(jsonquery({ name: 'Joe' }, ['get'])).toEqual({ name: 'Joe' })
      expect(jsonquery(2, ['get'])).toEqual(2)
    })

    test('should return undefined in case of a non existing path', () => {
      expect(jsonquery({}, ['get', 'foo', 'bar'])).toEqual(undefined)
    })

    test('should get a path using function get', () => {
      expect(jsonquery({ name: 'Joe' }, ['get', 'name'])).toEqual('Joe')
    })

    test('should get a path that has the same name as a function', () => {
      expect(jsonquery({ sort: 'Joe' }, ['get', 'sort'])).toEqual('Joe')
    })

    test('should get a nested value that has the same name as a function', () => {
      expect(jsonquery({ sort: { name: 'Joe' } }, ['get', 'sort', 'name'])).toEqual('Joe')
    })

    test('should get in item from an array', () => {
      expect(jsonquery(['A', 'B', 'C'], ['get', 1])).toEqual('B')
      expect(jsonquery({ arr: ['A', 'B', 'C'] }, ['get', 'arr', 1])).toEqual('B')
      expect(jsonquery([{ text: 'A' }, { text: 'B' }, { text: 'C' }], ['get', 1, 'text'])).toEqual(
        'B'
      )
    })
  })

  test('should execute a function', () => {
    expect(jsonquery([3, 1, 2], ['sort'])).toEqual([1, 2, 3])
  })

  describe('object', () => {
    test('should create an object', () => {
      expect(
        jsonquery(
          { a: 2, b: 3 },
          {
            aa: ['get', 'a'],
            bb: 42
          }
        )
      ).toEqual({
        aa: 2,
        bb: 42
      })
    })

    test('should create a nested object', () => {
      expect(
        jsonquery(data, {
          names: ['map', ['get', 'name']],
          stats: {
            count: ['size'],
            averageAge: [['map', ['get', 'age']], ['average']]
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
  })

  describe('pipe', () => {
    test('should execute a pipeline', () => {
      expect(
        jsonquery({ user: { name: 'Joe' } }, [
          ['get', 'user'],
          ['get', 'name']
        ])
      ).toEqual('Joe')
    })

    test('should create an object containing pipelines', () => {
      expect(
        jsonquery(data, {
          names: ['map', ['get', 'name']],
          count: ['size'],
          averageAge: [['map', ['get', 'age']], ['average']]
        })
      ).toEqual({
        names: ['Chris', 'Emily', 'Joe', 'Kevin', 'Michelle', 'Robert', 'Sarah'],
        count: 7,
        averageAge: 28
      })
    })

    test('should throw a helpful error when a pipe contains a compile time error', () => {
      let actualErr = undefined
      try {
        jsonquery(data, ['foo', 42])
      } catch (err) {
        actualErr = err
      }

      expect(actualErr?.message).toBe('Unknown function "foo"')
    })

    test('should throw a helpful error when a pipe contains a runtime error', () => {
      const scoreData = {
        participants: [
          { name: 'Chris', age: 23, scores: [7.2, 5, 8.0] },
          { name: 'Emily', age: 19 },
          { name: 'Joe', age: 32, scores: [6.1, 8.1] }
        ]
      }
      const query = [
        ['get', 'participants'],
        ['map', [['get', 'scores'], ['sum']]]
      ]

      let actualErr = undefined
      try {
        jsonquery(scoreData, query)
      } catch (err) {
        actualErr = err
      }

      expect(actualErr?.message).toBe("Cannot read properties of undefined (reading 'reduce')")
      expect(actualErr?.jsonquery).toEqual([
        { data: scoreData, query },
        {
          data: scoreData.participants,
          query: ['map', [['get', 'scores'], ['sum']]]
        },
        { data: { name: 'Emily', age: 19 }, query: [['get', 'scores'], ['sum']] },
        { data: undefined, query: ['sum'] }
      ])
    })
  })

  describe('map', () => {
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
          ['sort', ['get', 'maxScore'], 'desc']
        ])
      ).toEqual([
        { name: 'Emily', maxScore: 8, minScore: 2 },
        { name: 'Chris', maxScore: 7, minScore: 3 },
        { name: 'Joe', maxScore: 6, minScore: 1 }
      ])
    })

    test('should map a path', () => {
      expect(jsonquery(data, ['map', ['get', 'name']])).toEqual([
        'Chris',
        'Emily',
        'Joe',
        'Kevin',
        'Michelle',
        'Robert',
        'Sarah'
      ])
    })

    test('should map over an array using pick', () => {
      expect(jsonquery(data, ['map', ['pick', ['get', 'name']]])).toEqual([
        { name: 'Chris' },
        { name: 'Emily' },
        { name: 'Joe' },
        { name: 'Kevin' },
        { name: 'Michelle' },
        { name: 'Robert' },
        { name: 'Sarah' }
      ])
    })
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

  test('should resolve an function', () => {
    expect(jsonquery([], ['and', true, false])).toEqual(false)
    expect(jsonquery([], ['or', true, false])).toEqual(true)
    expect(jsonquery({ city: 'New York' }, ['eq', ['get', 'city'], 'New York'])).toEqual(true)
  })

  describe('filter', () => {
    test('should filter data using equal', () => {
      expect(jsonquery(data, ['filter', ['eq', ['get', 'city'], 'New York']])).toEqual([
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Joe', age: 32, city: 'New York' },
        { name: 'Sarah', age: 31, city: 'New York' }
      ])
    })

    test('should filter nested data using equal', () => {
      expect(
        jsonquery(nestedData, ['filter', ['eq', ['get', 'address', 'city'], 'New York']])
      ).toEqual([
        { name: 'Chris', age: 23, address: { city: 'New York' } },
        { name: 'Joe', age: 32, address: { city: 'New York' } },
        { name: 'Sarah', age: 31, address: { city: 'New York' } }
      ])
    })

    test('should filter multiple conditions (and)', () => {
      expect(
        jsonquery(nestedData, [
          ['filter', ['gt', ['get', 'age'], 30]],
          ['filter', ['eq', ['get', 'address', 'city'], 'New York']]
        ])
      ).toEqual([
        { name: 'Joe', age: 32, address: { city: 'New York' } },
        { name: 'Sarah', age: 31, address: { city: 'New York' } }
      ])
    })

    test('should filter with a condition being a function', () => {
      expect(jsonquery(scoresData, ['filter', ['gte', [['get', 'scores'], ['max']], 7]])).toEqual([
        { name: 'Chris', scores: [5, 7, 3] },
        { name: 'Emily', scores: [8, 5, 2, 5] }
      ])
    })

    test('should filter data using ne', () => {
      expect(jsonquery(data, ['filter', ['ne', ['get', 'city'], 'New York']])).toEqual([
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Kevin', age: 19, city: 'Atlanta' },
        { name: 'Michelle', age: 27, city: 'Los Angeles' },
        { name: 'Robert', age: 45, city: 'Manhattan' }
      ])
    })

    test('should filter data using gt', () => {
      expect(jsonquery(data, ['filter', ['gt', ['get', 'age'], 45]])).toEqual([])
    })

    test('should filter data using gte', () => {
      expect(jsonquery(data, ['filter', ['gte', ['get', 'age'], 45]])).toEqual([
        { name: 'Robert', age: 45, city: 'Manhattan' }
      ])
    })

    test('should filter data using lt', () => {
      expect(jsonquery(data, ['filter', ['lt', ['get', 'age'], 19]])).toEqual([])
    })

    test('should filter data using lte', () => {
      expect(jsonquery(data, ['filter', ['lte', ['get', 'age'], 19]])).toEqual([
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Kevin', age: 19, city: 'Atlanta' }
      ])
    })

    test('should filter data using gte and lte', () => {
      expect(
        jsonquery(data, [
          ['filter', ['gte', ['get', 'age'], 23]],
          ['filter', ['lte', ['get', 'age'], 27]]
        ])
      ).toEqual([
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Michelle', age: 27, city: 'Los Angeles' }
      ])

      expect(
        jsonquery(data, [
          ['filter', ['and', ['gte', ['get', 'age'], 23], ['lte', ['get', 'age'], 27]]]
        ])
      ).toEqual([
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Michelle', age: 27, city: 'Los Angeles' }
      ])
    })

    test('should filter data using "_in"', () => {
      expect(jsonquery(data, ['filter', ['in', ['get', 'age'], [19, 23]]])).toEqual([
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Kevin', age: 19, city: 'Atlanta' }
      ])
    })

    test('should filter data using "not in"', () => {
      expect(jsonquery(data, ['filter', ['not in', ['get', 'age'], [19, 23]]])).toEqual([
        { name: 'Joe', age: 32, city: 'New York' },
        { name: 'Michelle', age: 27, city: 'Los Angeles' },
        { name: 'Robert', age: 45, city: 'Manhattan' },
        { name: 'Sarah', age: 31, city: 'New York' }
      ])
    })

    test('should filter data using "regex"', () => {
      // search for a name containing 3 to 5 letters
      expect(jsonquery(data, ['filter', ['regex', ['get', 'name'], '^[A-z]{3,5}$']])).toEqual([
        { name: 'Chris', age: 23, city: 'New York' },
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Joe', age: 32, city: 'New York' },
        { name: 'Kevin', age: 19, city: 'Atlanta' },
        { name: 'Sarah', age: 31, city: 'New York' }
      ])
    })

    test('should filter data using "regex" with flags', () => {
      // search for a name containing a case-insensitive character "m"
      expect(jsonquery(data, ['filter', ['regex', ['get', 'name'], 'm', 'i']])).toEqual([
        { name: 'Emily', age: 19, city: 'Atlanta' },
        { name: 'Michelle', age: 27, city: 'Los Angeles' }
      ])
    })

    test('should filter multiple conditions using "and" and "or"', () => {
      const item1 = { a: 1, b: 1 }
      const item2 = { a: 2, b: 22 }
      const item3 = { a: 3, b: 33 }
      const data = [item1, item2, item3]

      expect(jsonquery(data, ['filter', ['eq', ['get', 'a'], 2]])).toEqual([item2])
      expect(jsonquery(data, ['filter', ['eq', ['get', 'a'], 3]])).toEqual([item3])
      expect(jsonquery(data, ['filter', ['eq', 3, ['get', 'a']]])).toEqual([item3])
      expect(jsonquery(data, ['filter', ['eq', 3, ['get', 'a']]])).toEqual([item3])

      expect(jsonquery(data, ['filter', ['eq', ['get', 'a'], ['get', 'b']]])).toEqual([item1])
      expect(jsonquery(data, ['filter', ['gte', 2, ['get', 'a']]])).toEqual([item1, item2])

      expect(
        jsonquery(data, ['filter', ['and', ['eq', ['get', 'a'], 2], ['eq', ['get', 'b'], 22]]])
      ).toEqual([item2])
      expect(
        jsonquery(data, ['filter', ['or', ['eq', ['get', 'a'], 1], ['eq', ['get', 'b'], 22]]])
      ).toEqual([item1, item2])
      expect(
        jsonquery(data, ['filter', ['or', ['eq', ['get', 'a'], 1], ['eq', ['get', 'b'], 4]]])
      ).toEqual([item1])
      expect(
        jsonquery(data, [
          'filter',
          [
            'or',
            ['and', ['eq', ['get', 'a'], 1], ['eq', ['get', 'b'], 1]],
            ['and', ['eq', ['get', 'a'], 2], ['eq', ['get', 'b'], 22]]
          ]
        ])
      ).toEqual([item1, item2])
      // FIXME: support multiple and/or in one go?

      const dataMsg = [{ message: 'hello' }]
      expect(jsonquery(dataMsg, ['filter', ['eq', ['get', 'message'], 'hello']])).toEqual(dataMsg)
      expect(jsonquery(dataMsg, ['filter', ['eq', 'hello', ['get', 'message']]])).toEqual(dataMsg)
    })
  })

  describe('sort', () => {
    test('should sort data (default direction)', () => {
      expect(jsonquery(data, ['sort', ['get', 'age']])).toEqual([
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
      expect(jsonquery(data, ['sort', ['get', 'age'], 'asc'])).toEqual([
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
      expect(jsonquery(data, ['sort', ['get', 'age'], 'desc'])).toEqual([
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
      expect(jsonquery(nestedData, ['sort', ['get', 'address', 'city']])).toEqual([
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
      expect(jsonquery([3, 7, 2, 6], ['sort', [], 'desc'])).toEqual([7, 6, 3, 2])
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
  })

  describe('pick', () => {
    test('should pick data from an array (single field)', () => {
      expect(jsonquery(data, ['pick', ['get', 'name']])).toEqual([
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
      expect(jsonquery({ a: 1, b: 2, c: 3 }, ['pick', ['get', 'b']])).toEqual({ b: 2 })
      expect(jsonquery({ a: 1, b: 2, c: 3 }, ['pick', ['get', 'b'], ['get', 'a']])).toEqual({
        b: 2,
        a: 1
      })
    })

    test('should pick data from an array (multiple fields)', () => {
      expect(jsonquery(data, ['pick', ['get', 'name'], ['get', 'city']])).toEqual([
        { name: 'Chris', city: 'New York' },
        { name: 'Emily', city: 'Atlanta' },
        { name: 'Joe', city: 'New York' },
        { name: 'Kevin', city: 'Atlanta' },
        { name: 'Michelle', city: 'Los Angeles' },
        { name: 'Robert', city: 'Manhattan' },
        { name: 'Sarah', city: 'New York' }
      ])
    })

    test('should pick data from an array (a single nested field)', () => {
      expect(jsonquery(nestedData, ['pick', ['get', 'address', 'city']])).toEqual([
        { city: 'New York' },
        { city: 'Atlanta' },
        { city: 'New York' },
        { city: 'Atlanta' },
        { city: 'Los Angeles' },
        { city: 'Manhattan' },
        { city: 'New York' }
      ])
    })

    test('should pick data from an array (multiple fields with nested fields)', () => {
      expect(jsonquery(nestedData, ['pick', ['get', 'name'], ['get', 'address', 'city']])).toEqual([
        { name: 'Chris', city: 'New York' },
        { name: 'Emily', city: 'Atlanta' },
        { name: 'Joe', city: 'New York' },
        { name: 'Kevin', city: 'Atlanta' },
        { name: 'Michelle', city: 'Los Angeles' },
        { name: 'Robert', city: 'Manhattan' },
        { name: 'Sarah', city: 'New York' }
      ])
    })
  })

  test('should group items by a key', () => {
    expect(jsonquery(data, ['groupBy', ['get', 'city']])).toEqual({
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

    expect(jsonquery(users, ['keyBy', ['get', 'id']])).toEqual({
      1: { id: 1, name: 'Joe' },
      2: { id: 2, name: 'Sarah' },
      3: { id: 3, name: 'Chris' }
    })
  })

  test('should handle duplicate keys in keyBy', () => {
    const users = [
      { id: 1, name: 'Joe' },
      { id: 2, name: 'Sarah' },
      { id: 1, name: 'Chris' }
    ]

    // keep the first occurrence
    expect(jsonquery(users, ['keyBy', ['get', 'id']])).toEqual({
      1: { id: 1, name: 'Joe' },
      2: { id: 2, name: 'Sarah' }
    })
  })

  test('should get nested data from an object', () => {
    expect(jsonquery(friendsData, ['get', 'friends'])).toEqual(data)
  })

  test('should get nested data from an array with objects', () => {
    expect(jsonquery(nestedData, ['map', ['get', 'address', 'city']])).toEqual([
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
    // keep the first occurrence
    expect(jsonquery(data, ['uniqBy', ['get', 'city']])).toEqual([
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
    expect(jsonquery(null, ['round', 23.1345])).toEqual(23)
    expect(jsonquery(null, ['round', 23.761])).toEqual(24)
    expect(jsonquery(null, ['round', 23.1345, 2])).toEqual(23.13)
    expect(jsonquery(null, ['round', 23.1345, 3])).toEqual(23.135)
    expect(jsonquery({ a: 23.1345 }, ['round', ['get', 'a']])).toEqual(23)
  })

  test('should round an array with values', () => {
    expect(jsonquery([2.24, 3.77, 4.49], ['map', ['round', ['get']]])).toEqual([2, 4, 4])
    expect(jsonquery([2.24, 3.77, 4.49], ['map', ['round', ['get'], 1]])).toEqual([2.2, 3.8, 4.5])
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

  test('should process "not"', () => {
    expect(jsonquery(data, ['not', 2])).toEqual(false)
    expect(jsonquery({ a: false }, ['not', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: true }, ['not', ['get', 'a']])).toEqual(false)
    expect(jsonquery({ nested: { a: false } }, ['not', ['get', 'nested', 'a']])).toEqual(true)
    expect(jsonquery({ nested: { a: true } }, ['not', ['get', 'nested', 'a']])).toEqual(false)

    expect(jsonquery(data, ['filter', ['not', ['eq', ['get', 'city'], 'New York']]])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should process "exists"', () => {
    expect(jsonquery({ a: false }, ['exists', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: null }, ['exists', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: 2 }, ['exists', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: 0 }, ['exists', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ a: '' }, ['exists', ['get', 'a']])).toEqual(true)
    expect(jsonquery({ nested: { a: 2 } }, ['exists', ['get', 'nested', 'a']])).toEqual(true)

    expect(jsonquery({ a: undefined }, ['exists', ['get', 'a']])).toEqual(false)
    expect(jsonquery({}, ['exists', ['get', 'a']])).toEqual(false)
    expect(jsonquery({}, ['exists', ['get', 'nested', 'a']])).toEqual(false)
    expect(jsonquery({}, ['exists', ['get', 'sort']])).toEqual(false)

    const detailsData = [
      { name: 'Chris', details: { age: 16 } },
      { name: 'Emily' },
      { name: 'Joe', details: { age: 18 } }
    ]
    expect(jsonquery(detailsData, ['filter', ['exists', ['get', 'details']]])).toEqual([
      { name: 'Chris', details: { age: 16 } },
      { name: 'Joe', details: { age: 18 } }
    ])
  })

  test('should process function eq', () => {
    expect(jsonquery({ a: 6 }, ['eq', ['get', 'a'], 6])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['eq', ['get', 'a'], 2])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['eq', ['get', 'a'], '6'])).toEqual(false)
    expect(jsonquery({ a: 'Hi' }, ['eq', ['get', 'a'], 'Hi'])).toEqual(true)
    expect(jsonquery({ a: 'Hi' }, ['eq', ['get', 'a'], 'Hello'])).toEqual(false)
  })

  test('should process function gt', () => {
    expect(jsonquery({ a: 6 }, ['gt', ['get', 'a'], 5])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['gt', ['get', 'a'], 6])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['gt', ['get', 'a'], 7])).toEqual(false)
  })

  test('should process function gte', () => {
    expect(jsonquery({ a: 6 }, ['gte', ['get', 'a'], 5])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['gte', ['get', 'a'], 6])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['gte', ['get', 'a'], 7])).toEqual(false)
  })

  test('should process function lt', () => {
    expect(jsonquery({ a: 6 }, ['lt', ['get', 'a'], 5])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['lt', ['get', 'a'], 6])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['lt', ['get', 'a'], 7])).toEqual(true)
  })

  test('should process function lte', () => {
    expect(jsonquery({ a: 6 }, ['lte', ['get', 'a'], 5])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['lte', ['get', 'a'], 6])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['lte', ['get', 'a'], 7])).toEqual(true)
  })

  test('should process function ne', () => {
    expect(jsonquery({ a: 6 }, ['ne', ['get', 'a'], 6])).toEqual(false)
    expect(jsonquery({ a: 6 }, ['ne', ['get', 'a'], 2])).toEqual(true)
    expect(jsonquery({ a: 6 }, ['ne', ['get', 'a'], '6'])).toEqual(true)
    expect(jsonquery({ a: 'Hi' }, ['ne', ['get', 'a'], 'Hi'])).toEqual(false)
    expect(jsonquery({ a: 'Hi' }, ['ne', ['get', 'a'], 'Hello'])).toEqual(true)
  })

  test('should process function add', () => {
    expect(jsonquery({ a: 6, b: 2 }, ['add', ['get', 'a'], ['get', 'b']])).toEqual(8)
  })

  test('should process function subtract', () => {
    expect(jsonquery({ a: 6, b: 2 }, ['subtract', ['get', 'a'], ['get', 'b']])).toEqual(4)
  })

  test('should process function multiply', () => {
    expect(jsonquery({ a: 6, b: 2 }, ['multiply', ['get', 'a'], ['get', 'b']])).toEqual(12)
  })

  test('should process function divide', () => {
    expect(jsonquery({ a: 6, b: 2 }, ['divide', ['get', 'a'], ['get', 'b']])).toEqual(3)
  })

  test('should process function pow', () => {
    expect(jsonquery({ a: 2, b: 3 }, ['pow', ['get', 'a'], ['get', 'b']])).toEqual(8)
    expect(jsonquery({ a: 25, b: 1 / 2 }, ['pow', ['get', 'a'], ['get', 'b']])).toEqual(5) // sqrt
  })

  test('should process function mod (remainder)', () => {
    expect(jsonquery({ a: 8, b: 3 }, ['mod', ['get', 'a'], ['get', 'b']])).toEqual(2)
  })

  test('should calculate the minimum value', () => {
    expect(jsonquery([3, -4, 1, -7], ['min'])).toEqual(-7)
  })

  test('should calculate the absolute value', () => {
    expect(jsonquery(null, ['abs', 2])).toEqual(2)
    expect(jsonquery(null, ['abs', -2])).toEqual(2)
    expect(jsonquery({ a: -3 }, ['abs', ['get', 'a']])).toEqual(3)
    expect(jsonquery([3, -4, 1, -7], ['map', ['abs', ['get']]])).toEqual([3, 4, 1, 7])
  })

  test('should process multiple operations', () => {
    expect(
      jsonquery(friendsData, [
        ['get', 'friends'],
        ['filter', ['eq', ['get', 'city'], 'New York']],
        ['sort', ['get', 'age']],
        ['map', ['get', 'name']],
        ['limit', 2]
      ])
    ).toEqual(['Chris', 'Sarah'])
  })

  test('should extend with a custom function "times"', () => {
    const options = {
      functions: {
        times: (value: number) => (data: number[]) => data.map((item) => item * value)
      }
    }

    expect(jsonquery([1, 2, 3], ['times', 2], options)).toEqual([2, 4, 6])
    expect(() => jsonquery([1, 2, 3], ['times', 2])).toThrow('Unknown function "times"')
  })

  test('should override an existing function', () => {
    const options = {
      functions: {
        sort: () => (_data: unknown[]) => 'custom sort'
      }
    }

    expect(jsonquery([2, 3, 1], ['sort'], options)).toEqual('custom sort')
  })

  test('should be able to insert a function in a nested compile', () => {
    const options = {
      functions: {
        times: (value: JSONQuery) => {
          const _options = {
            functions: {
              foo: () => (_data: unknown) => 42
            }
          }
          const _value = compile(value, _options)

          return (data: number[]) => data.map((item) => item * (_value(data) as number))
        }
      }
    }

    expect(jsonquery([1, 2, 3], ['times', 2], options)).toEqual([2, 4, 6])
    expect(jsonquery([1, 2, 3], ['times', ['foo']], options)).toEqual([42, 84, 126])

    // The function `foo` must not be available outside the `times` function
    expect(() => jsonquery([1, 2, 3], ['foo'], options)).toThrow('Unknown function "foo"')
  })

  test('should cleanup the custom function stack when creating a query throws an error', () => {
    const options = {
      functions: {
        sort: () => {
          throw new Error('Test Error')
        }
      }
    }

    expect(() => jsonquery({}, ['sort'], options)).toThrow('Test Error')

    expect(jsonquery([2, 3, 1], ['sort'])).toEqual([1, 2, 3])
  })

  test('should extend with a custom function abouteq', () => {
    const options = {
      functions: {
        abouteq: buildFunction((a, b) => a == b) // loosely equal
      }
    }

    expect(jsonquery({ a: 2 }, ['abouteq', ['get', 'a'], 2], options)).toEqual(true)
    expect(jsonquery({ a: 2 }, ['abouteq', ['get', 'a'], '2'], options)).toEqual(true)
  })

  test('should use functions to calculate a shopping cart', () => {
    const data = [
      { name: 'bread', price: 2.5, quantity: 2 },
      { name: 'milk', price: 1.2, quantity: 3 }
    ]

    expect(
      jsonquery(data, [['map', ['multiply', ['get', 'price'], ['get', 'quantity']]], ['sum']])
    ).toEqual(8.6)
  })

  test('should be able to query the jmespath example', () => {
    const options = {
      functions: {
        join:
          (separator = ', ') =>
          (data: unknown[]) =>
            data.join(separator)
      }
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
          ['filter', ['eq', ['get', 'state'], 'WA']],
          ['map', ['get', 'name']],
          ['sort'],
          { WashingtonCities: ['join'] }
        ],
        options
      )
    ).toEqual({
      WashingtonCities: 'Bellevue, Olympia, Seattle'
    })
  })
})
