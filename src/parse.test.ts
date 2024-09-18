import { describe, expect, test } from 'vitest'
import { parse } from './parse'
import { JSONQueryParseOptions } from './types'

describe('parse', () => {
  describe('property', () => {
    test('should parse a property without quotes', () => {
      expect(parse('.name')).toEqual(['get', 'name'])
      expect(parse('.AaZz_$')).toEqual(['get', 'AaZz_$'])
      expect(parse('.AaZz09_$')).toEqual(['get', 'AaZz09_$'])
      expect(parse('.9')).toEqual(['get', 9])
      expect(parse('.123')).toEqual(['get', 123])
      expect(parse('.0')).toEqual(['get', 0])
    })

    test('should throw an error in case of an invalid unquoted property', () => {
      expect(() => parse('.01')).toThrow("Unexpected part '1'")
    })

    test('should parse a property with quotes', () => {
      expect(parse('."name"')).toEqual(['get', 'name'])
      expect(parse('."escape \\n \\"chars"')).toEqual(['get', 'escape \n "chars'])
    })

    test('should throw an error when a property misses an end quote', () => {
      expect(() => parse('."name')).toThrow('Property expected (pos: 1)')
    })

    test('should parse a nested property', () => {
      expect(parse('.address.city')).toEqual(['get', 'address', 'city'])
      expect(parse('."address"."city"')).toEqual(['get', 'address', 'city'])
      expect(parse('.array.2')).toEqual(['get', 'array', 2])
    })

    test('should throw an error in case of an invalid property', () => {
      expect(() => parse('.foo#')).toThrow("Unexpected part '#'")
      expect(() => parse('.foo#bar')).toThrow("Unexpected part '#bar'")
    })
  })

  describe('function', () => {
    test('should parse a function without arguments', () => {
      expect(parse('sort()')).toEqual(['sort'])
      expect(parse('sort( )')).toEqual(['sort'])
      expect(parse('sort ( )')).toEqual(['sort'])
    })

    test('should parse a function with one argument', () => {
      expect(parse('sort(.age)')).toEqual(['sort', ['get', 'age']])
      expect(parse('sort ( .age )')).toEqual(['sort', ['get', 'age']])
    })

    test('should parse a function with multiple arguments', () => {
      expect(parse('sort(.age, "desc")')).toEqual(['sort', ['get', 'age'], 'desc'])
    })

    test('should parse a custom function', () => {
      const options: JSONQueryParseOptions = {
        functions: { customFn: true }
      }

      expect(parse('customFn(.age, "desc")', options)).toEqual(['customFn', ['get', 'age'], 'desc'])
    })

    test('should throw an error when the end bracket is missing', () => {
      expect(() => parse('sort(.age, "desc"')).toThrow("Character ')' expected (pos: 17)")
    })

    test('should throw an error when a comma is missing', () => {
      expect(() => parse('sort(.age "desc")')).toThrow("Character ',' expected (pos: 10)")
    })
  })

  describe('operator', () => {
    test('should parse an operator', () => {
      expect(parse('.score==8')).toEqual(['eq', ['get', 'score'], 8])
      expect(parse('.score == 8')).toEqual(['eq', ['get', 'score'], 8])
      expect(parse('.score < 8')).toEqual(['lt', ['get', 'score'], 8])
      expect(parse('.score <= 8')).toEqual(['lte', ['get', 'score'], 8])
      expect(parse('.score > 8')).toEqual(['gt', ['get', 'score'], 8])
      expect(parse('.score >= 8')).toEqual(['gte', ['get', 'score'], 8])
      expect(parse('.score != 8')).toEqual(['ne', ['get', 'score'], 8])
      expect(parse('.score + 8')).toEqual(['add', ['get', 'score'], 8])
      expect(parse('.score - 8')).toEqual(['subtract', ['get', 'score'], 8])
      expect(parse('.score * 8')).toEqual(['multiply', ['get', 'score'], 8])
      expect(parse('.score / 8')).toEqual(['divide', ['get', 'score'], 8])
      expect(parse('.score ^ 8')).toEqual(['pow', ['get', 'score'], 8])
      expect(parse('.score % 8')).toEqual(['mod', ['get', 'score'], 8])
    })

    test('should parse an operator having the same name as a function', () => {
      expect(parse('0 and 1')).toEqual(['and', 0, 1])
      expect(parse('.a and .b')).toEqual(['and', ['get', 'a'], ['get', 'b']])
    })

    test('should parse nested operators', () => {
      expect(parse('(.a == "A") and (.b == "B")')).toEqual([
        'and',
        ['eq', ['get', 'a'], 'A'],
        ['eq', ['get', 'b'], 'B']
      ])
    })

    test('should throw an error when using multiple operators without brackets', () => {
      expect(() => parse('.a == "A" and .b == "B"')).toThrow('Unexpected part \'and .b == "B"\'')
    })

    test('should throw an error in case of an unknown operator', () => {
      expect(() => parse('.a === "A"')).toThrow('Unexpected part \'= "A"\'')
      expect(() => parse('.a <> "A"')).toThrow('Unexpected part \'> "A"\'')
    })

    test('should throw an error in case a missing right hand side', () => {
      expect(() => parse('.a ==')).toThrow('Unexpected part "= "A""')
    })

    test('should throw an error in case a missing left and right hand side', () => {
      expect(() => parse('+')).toThrow('Foo')
    })

    test('should parse a custom operator', () => {
      const options: JSONQueryParseOptions = {
        operators: { aboutEq: '~=' }
      }

      expect(parse('.score ~= 8', options)).toEqual(['aboutEq', ['get', 'score'], 8])
    })
  })

  test('should parse a pipe', () => {
    expect(parse('.friends | sort(.age)')).toEqual([
      ['get', 'friends'],
      ['sort', ['get', 'age']]
    ])
  })

  describe('parenthesis', () => {
    test('should parse parenthesis', () => {
      expect(parse('(.friends)')).toEqual(['get', 'friends'])
      expect(parse('( .friends)')).toEqual(['get', 'friends'])
      expect(parse('(.friends )')).toEqual(['get', 'friends'])
      expect(parse('(.age == 18)')).toEqual(['eq', ['get', 'age'], 18])
    })

    test('should throw an error when missing closing parenthesis', () => {
      expect(() => parse('(.friends')).toThrow("Character ')' expected (pos: 9)")
    })
  })

  describe('object', () => {
    test('should parse an object (1)', () => {
      expect(parse('{}')).toEqual({})
      expect(parse('{ }')).toEqual({})
      expect(parse('{a:1}')).toEqual({ a: 1 })
      expect(parse('{a1:1}')).toEqual({ a1: 1 })
      expect(parse('{AaZz_$019:1}')).toEqual({ AaZz_$019: 1 })
      expect(parse('{ a : 1 }')).toEqual({ a: 1 })
      expect(parse('{a:1,b:2}')).toEqual({ a: 1, b: 2 })
      expect(parse('{ a : 1 , b : 2 }')).toEqual({ a: 1, b: 2 })
      expect(parse('{ "a" : 1 , "b" : 2 }')).toEqual({ a: 1, b: 2 })
      expect(parse('{2:"two"}')).toEqual({ 2: 'two' })
    })

    test('should parse an object (2)', () => {
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

    test('should throw an error when missing closing parenthesis', () => {
      expect(() => parse('{a:1')).toThrow("Character ',' expected (pos: 4)")
    })

    test('should throw an error when missing a comma', () => {
      expect(() => parse('{a:1 b:2}')).toThrow("Character ',' expected (pos: 5)")
    })

    test('should throw an error when missing a colon', () => {
      expect(() => parse('{a')).toThrow("Character ':' expected (pos: 2)")
    })

    test('should throw an error when missing a key', () => {
      expect(() => parse('{{')).toThrow('Key expected (pos: 1)')
      expect(() => parse('{a:2,{')).toThrow('Key expected (pos: 5)')
    })

    test('should throw an error when missing a value', () => {
      expect(() => parse('{a:2,b:}')).toThrow('Value expected (pos: 7)')
    })
  })

  test('should parse a string', () => {
    expect(parse('"hello"')).toEqual('hello')
    expect(parse(' "hello"')).toEqual('hello')
    expect(parse('"hello" ')).toEqual('hello')
    expect(() => parse('"hello')).toThrow("Unexpected part '\"hello'")
  })

  test('should parse a number', () => {
    expect(parse('42')).toEqual(42)
    expect(parse('-42')).toEqual(-42)
    expect(parse('2.3')).toEqual(2.3)
    expect(parse('-2.3')).toEqual(-2.3)
    expect(parse('2.3e2')).toEqual(230)
    expect(parse('2.3e+2')).toEqual(230)
    expect(parse('2.3e-2')).toEqual(0.023)
    expect(parse('2.3E+2')).toEqual(230)
    expect(parse('2.3E-2')).toEqual(0.023)

    // TODO: test throwing an exception in case of an invalid number
  })

  test('should parse a boolean', () => {
    expect(parse('true')).toEqual(true)
    expect(parse('false')).toEqual(false)
  })

  test('should parse null', () => {
    expect(parse('null')).toEqual(null)
  })

  test('should throw an error in case of garbage at the end', () => {
    expect(() => parse('null 2')).toThrow("Unexpected part '2' (pos 5)")
    expect(() => parse('["sort"] 2')).toThrow("Unexpected part '2' (pos 9)")
  })

  test('should ship whitespace characters', () => {
    expect(parse(' \n\r\t"hello" \n\r\t')).toEqual('hello')
  })

  // FIXME: test the different whitespaces
  // FIXME: test all characters of unquoted strings
})
