import { describe, expect, test } from 'vitest'
import { parse } from './parse'

describe('parse', () => {
  test('should parse a property without quotes', () => {
    expect(parse('.name')).toEqual(['get', 'name'])
  })

  test('should parse a property with quotes', () => {
    expect(parse('."name"')).toEqual(['get', 'name'])
  })

  test('should parse a nested property', () => {
    expect(parse('.address.city')).toEqual(['get', 'address', 'city'])
    expect(parse('."address"."city"')).toEqual(['get', 'address', 'city'])
    // expect(parse('.array.2')).toEqual(['get', 'array', 2]) // FIXME: parse a number
  })

  test('should parse a function without arguments', () => {
    expect(parse('sort()')).toEqual(['sort'])
  })

  test('should parse a function with one argument', () => {
    expect(parse('sort(.age)')).toEqual(['sort', ['get', 'age']])
  })

  test('should parse a function with multiple arguments', () => {
    expect(parse('sort(.age, "desc")')).toEqual(['sort', ['get', 'age'], 'desc'])
  })

  test('should parse a pipe', () => {
    expect(parse('.friends | sort(.age)')).toEqual([
      ['get', 'friends'],
      ['sort', ['get', 'age']]
    ])
  })

  test('should parse an object', () => {
    expect(
      parse(`{ 
        name: .name, 
        city: .address.city, 
        averageAge: map(.age) | average() 
      }`)
    ).toEqual({
      name: ['get', 'name'],
      city: ['get', 'address', 'city'],
      averageAge: [['map', ['get', 'age']], ['average']]
    })
  })

  test('should parse a string', () => {
    expect(parse('"hello"')).toEqual('hello')
  })

  test('should parse a number', () => {
    expect(parse('42')).toEqual(42)
    expect(parse('2.3')).toEqual(2.3)
  })

  test('should parse a boolean', () => {
    expect(parse('true')).toEqual(true)
    expect(parse('false')).toEqual(false)
  })

  test('should parse null', () => {
    expect(parse('null')).toEqual(null)
  })
})
