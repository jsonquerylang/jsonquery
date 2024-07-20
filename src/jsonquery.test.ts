import { describe, expect, test } from 'vitest'
import { all, jsonquery } from './jsonquery.js'

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
  test('should create an object', () => {
    expect(
      jsonquery(data, {
        names: ['pick', 'name'],
        count: ['size'],
        averageAge: [['pick', 'age'], ['average']]
      })
    ).toEqual({
      names: ['Chris', 'Emily', 'Joe', 'Kevin', 'Michelle', 'Robert', 'Sarah'],
      count: 7,
      averageAge: 28
    })
  })

  test('should map over an array', () => {
    expect(
      jsonquery(scoresData, [
        [
          'map',
          {
            name: ['get', 'name'],
            maxScore: [['get', 'scores'], ['max']]
          }
        ],
        ['sort', 'maxScore', 'desc']
      ])
    ).toEqual([
      { name: 'Emily', maxScore: 8 },
      { name: 'Chris', maxScore: 7 },
      { name: 'Joe', maxScore: 6 }
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

  test('should match data using ==', () => {
    expect(jsonquery(data, ['match', 'city', '==', 'New York'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should match nested data using ==', () => {
    expect(jsonquery(nestedData, ['match', ['address', 'city'], '==', 'New York'])).toEqual([
      { name: 'Chris', age: 23, address: { city: 'New York' } },
      { name: 'Joe', age: 32, address: { city: 'New York' } },
      { name: 'Sarah', age: 31, address: { city: 'New York' } }
    ])
  })

  test('should match data using !=', () => {
    expect(jsonquery(data, ['match', 'city', '!=', 'New York'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should match data using >', () => {
    expect(jsonquery(data, ['match', 'age', '>', 45])).toEqual([])
  })

  test('should match data using >=', () => {
    expect(jsonquery(data, ['match', 'age', '>=', 45])).toEqual([
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should match data using <', () => {
    expect(jsonquery(data, ['match', 'age', '<', 19])).toEqual([])
  })

  test('should match data using <=', () => {
    expect(jsonquery(data, ['match', 'age', '<=', 19])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should match data using >= and <=', () => {
    expect(
      jsonquery(data, [
        ['match', 'age', '>=', 23],
        ['match', 'age', '<=', 27]
      ])
    ).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' }
    ])
  })

  test('should match data using "in"', () => {
    expect(jsonquery(data, ['match', 'age', 'in', [19, 23]])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should match data using "not in"', () => {
    expect(jsonquery(data, ['match', 'age', 'not in', [19, 23]])).toEqual([
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' },
      { name: 'Sarah', age: 31, city: 'New York' }
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

  test('should pick data (single field)', () => {
    expect(jsonquery(data, ['pick', 'name'])).toEqual([
      'Chris',
      'Emily',
      'Joe',
      'Kevin',
      'Michelle',
      'Robert',
      'Sarah'
    ])
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
      'New York',
      'Atlanta',
      'New York',
      'Atlanta',
      'Los Angeles',
      'Manhattan',
      'New York'
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

  test('should get unique values from a list', () => {
    expect(jsonquery([2, 3, 2, 7, 1, 1], ['uniq'])).toEqual([2, 3, 7, 1])
  })

  test('should calculate the sum', () => {
    expect(jsonquery([2, 3, 2, 7, 1, 1], ['sum'])).toEqual(16)
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
        ['match', 'city', '==', 'New York'],
        ['sort', 'age'],
        ['pick', 'name'],
        ['limit', 2]
      ])
    ).toEqual(['Chris', 'Sarah'])
  })

  test('should extend with a custom operator "times"', () => {
    const times = (data: number[], value: number) => data.map((item) => item * value)

    const functions = { ...all, times }

    expect(jsonquery([1, 2, 3], ['times', 2], functions)).toEqual([2, 4, 6])
  })
})
