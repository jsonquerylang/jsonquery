import { describe, expect, test } from 'vitest'
import { all, jsonquery, sort } from './jsonquery.js'

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

describe('jsonquery', () => {
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

  test('should get nested data from an object', () => {
    expect(jsonquery(friendsData, [['get', 'friends']])).toEqual(data)
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

  test('should extend with a custom operator (1)', () => {
    const max = (data: unknown[], field: string) => sort(data, field, 'desc')[0]
    const operations = { ...all, max }

    expect(jsonquery(data, ['max', 'age'], operations)).toEqual({
      name: 'Robert',
      age: 45,
      city: 'Manhattan'
    })
  })
})
