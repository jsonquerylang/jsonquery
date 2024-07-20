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

describe('jsonquery', () => {
  test('should filter data using ==', () => {
    expect(jsonquery(data, ['match', 'city', '==', 'New York'])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Joe', age: 32, city: 'New York' },
      { name: 'Sarah', age: 31, city: 'New York' }
    ])
  })

  test('should filter data using !=', () => {
    expect(jsonquery(data, ['match', 'city', '!=', 'New York'])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' },
      { name: 'Michelle', age: 27, city: 'Los Angeles' },
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should filter data using >', () => {
    expect(jsonquery(data, ['match', 'age', '>', 45])).toEqual([])
  })

  test('should filter data using >=', () => {
    expect(jsonquery(data, ['match', 'age', '>=', 45])).toEqual([
      { name: 'Robert', age: 45, city: 'Manhattan' }
    ])
  })

  test('should filter data using <', () => {
    expect(jsonquery(data, ['match', 'age', '<', 19])).toEqual([])
  })

  test('should filter data using <=', () => {
    expect(jsonquery(data, ['match', 'age', '<=', 19])).toEqual([
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should filter data using >= and <=', () => {
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

  test('should filter data using "in"', () => {
    expect(jsonquery(data, ['match', 'age', 'in', [19, 23]])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' },
      { name: 'Kevin', age: 19, city: 'Atlanta' }
    ])
  })

  test('should filter data using "not in"', () => {
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

  test('should project data', () => {
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

  test('should limit data', () => {
    expect(jsonquery(data, ['limit', 2])).toEqual([
      { name: 'Chris', age: 23, city: 'New York' },
      { name: 'Emily', age: 19, city: 'Atlanta' }
    ])
  })

  test('should process multiple operations', () => {
    expect(
      jsonquery(data, [
        ['match', 'city', '==', 'New York'],
        ['sort', 'age'],
        ['pick', 'name'],
        ['limit', 2]
      ])
    ).toEqual([{ name: 'Chris' }, { name: 'Sarah' }])
  })

  test('should extend with a custom operator (1)', () => {
    const max = (data: unknown[], [_, field]: ['max', string]) =>
      sort(data, ['sort', field, 'desc'])[0]
    const operations = { ...all, max }

    expect(jsonquery(data, ['max', 'age'], operations)).toEqual({
      name: 'Robert',
      age: 45,
      city: 'Manhattan'
    })
  })
})
