import { describe, expect, test } from 'vitest'
import { defaultOperations, jsonquery, sort } from './jsonquery.js'

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

describe('jsonquery', () => {
  test('should filter data using $eq', () => {
    expect(jsonquery([{ $match: { city: { $eq: 'New York' } } }], data)).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should filter data using $ne', () => {
    expect(jsonquery([{ $match: { city: { $ne: 'New York' } } }], data)).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should filter data using $gte and $lte', () => {
    expect(jsonquery([{ $match: { age: { $gte: 23, $lte: 27 } } }], data)).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' }
    ])
  })

  test('should sort data', () => {
    expect(jsonquery([{ $sort: { age: 1 } }], data)).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Sarah', age: 31, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should project data', () => {
    expect(jsonquery([{ $project: { name: 1, city: 1 } }], data)).toEqual([
      { name: 'Chris', city: 'New York' },
      { name: 'Emily', city: 'Atlanta' },
      { name: 'Joe', city: 'New York' },
      { name: 'Kevin', city: 'Atlanta' },
      { name: 'Michelle', city: 'Los Angeles' },
      { name: 'Robert', city: 'Manhattan' },
      { name: 'Sarah', city: 'New York' }
    ])
  })

  test('should limit data', () => {
    expect(jsonquery([{ $limit: 2 }], data)).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' }
    ])
  })

  test('should process multiple operations', () => {
    expect(
      jsonquery(
        [
          { $match: { city: { $eq: 'New York' } } },
          { $sort: { age: 1 } },
          { $project: { name: 1 } },
          { $limit: 2 }
        ],
        data
      )
    ).toEqual([{ name: 'Chris' }, { name: 'Sarah' }])
  })

  test('should combine multiple operations in a single object', () => {
    expect(
      jsonquery(
        [
          {
            $match: { city: { $eq: 'New York' } },
            $sort: { age: 1 },
            $project: { name: 1 },
            $limit: 2
          }
        ],
        data
      )
    ).toEqual([{ name: 'Chris' }, { name: 'Sarah' }])
  })

  test('should extend with a custom operator (1)', () => {
    const max = (field: string, data: unknown[]) => sort({ [field]: -1 }, data)[0]
    const operations = { ...defaultOperations, $max: max }

    expect(jsonquery([{ $max: 'age' }], data, operations)).toEqual({
      name: 'Robert',
      age: 45,
      city: 'Manhattan'
    })
  })

  // TODO: test all match operators and with different types of values
  // TODO: test asc/desc sorting
  // TODO: test sorting by multiple fields
  // TODO: test sorting with strings
  // TODO: test adding a custom operator
})
