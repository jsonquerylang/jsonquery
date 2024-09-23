import { describe, expect, test } from 'vitest'
import { parse } from './parse'
import type { JSONQueryParseOptions } from './types'

describe('parse', () => {
  describe('property', () => {
    test('should parse a property without quotes', () => {
      expect(parse('.name')).toEqual(['get', 'name'])
      expect(parse('.AaZz_$')).toEqual(['get', 'AaZz_$'])
      expect(parse('.AaZz09_$')).toEqual(['get', 'AaZz09_$'])
      expect(parse('.9')).toEqual(['get', 9])
      expect(parse('.123')).toEqual(['get', 123])
      expect(parse('.0')).toEqual(['get', 0])
      expect(parse(' .name ')).toEqual(['get', 'name'])
      expect(() => parse('.')).toThrow('Property expected (pos: 1)')
    })

    test('should throw an error in case of an invalid unquoted property', () => {
      expect(() => parse('.01')).toThrow("Unexpected part '1'")
      expect(() => parse('.1abc')).toThrow("Unexpected part 'abc'")
      expect(() => parse('.[')).toThrow('Property expected (pos: 1)')
    })

    test('should parse a property with quotes', () => {
      expect(parse('."name"')).toEqual(['get', 'name'])
      expect(parse(' ."name" ')).toEqual(['get', 'name'])
      expect(parse('."escape \\n \\"chars"')).toEqual(['get', 'escape \n "chars'])
    })

    test('should throw an error when a property misses an end quote', () => {
      expect(() => parse('."name')).toThrow('Property expected (pos: 1)')
    })

    test('should throw an error when there is whitespace between the dot and the property name', () => {
      expect(() => parse('. "name"')).toThrow('Property expected (pos: 1)')
      expect(() => parse('."address" ."city"')).toThrow('Unexpected part \'."city"\' (pos: 11)')
      expect(() => parse('.address .city')).toThrow("Unexpected part '.city' (pos: 9)")
    })

    test('should parse a nested property', () => {
      expect(parse('.address.city')).toEqual(['get', 'address', 'city'])
      expect(parse('."address"."city"')).toEqual(['get', 'address', 'city'])
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
      expect(parse(' sort ( ) ')).toEqual(['sort'])
    })

    test('should parse a function with one argument', () => {
      expect(parse('sort(.age)')).toEqual(['sort', ['get', 'age']])
      expect(parse('sort(get())')).toEqual(['sort', ['get']])
      expect(parse('sort ( .age )')).toEqual(['sort', ['get', 'age']])
    })

    test('should parse a function with multiple arguments', () => {
      expect(parse('sort(.age, "desc")')).toEqual(['sort', ['get', 'age'], 'desc'])
      expect(parse('sort(get(), "desc")')).toEqual(['sort', ['get'], 'desc'])
    })

    test('should parse a custom function', () => {
      const options: JSONQueryParseOptions = {
        functions: { customFn: true }
      }

      expect(parse('customFn(.age, "desc")', options)).toEqual(['customFn', ['get', 'age'], 'desc'])
    })

    test('should throw an error in case of an unknown function name', () => {
      expect(() => parse('foo(42)')).toThrow("Unknown function 'foo' (pos: 4)")
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
      expect(parse('.name in ["Joe", "Sarah"]')).toEqual([
        'in',
        ['get', 'name'],
        ['array', 'Joe', 'Sarah']
      ])
      expect(parse('.name not in ["Joe", "Sarah"]')).toEqual([
        'not in',
        ['get', 'name'],
        ['array', 'Joe', 'Sarah']
      ])
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

      expect(parse('(.a == "A") or (.b == "B")')).toEqual([
        'or',
        ['eq', ['get', 'a'], 'A'],
        ['eq', ['get', 'b'], 'B']
      ])

      expect(parse('(.a == "A") or ((.b == "B") and (.c == "C"))')).toEqual([
        'or',
        ['eq', ['get', 'a'], 'A'],
        ['and', ['eq', ['get', 'b'], 'B'], ['eq', ['get', 'c'], 'C']]
      ])

      expect(parse('(.a * 2) + 3')).toEqual(['add', ['multiply', ['get', 'a'], 2], 3])
      expect(parse('3 + (.a * 2)')).toEqual(['add', 3, ['multiply', ['get', 'a'], 2]])
    })

    test('should throw an error when using multiple operators without brackets', () => {
      expect(() => parse('.a == "A" and .b == "B"')).toThrow('Unexpected part \'and .b == "B"\'')
      expect(() => parse('(.a == "A") and (.b == "B") and (.C == "C")')).toThrow(
        'Unexpected part \'and (.C == "C")\' (pos: 28)'
      )
      expect(() => parse('.a + 2 * 3')).toThrow("Unexpected part '* 3' (pos: 7)")
    })

    test('should throw an error in case of an unknown operator', () => {
      expect(() => parse('.a === "A"')).toThrow('Value expected (pos: 5)')
      expect(() => parse('.a <> "A"')).toThrow('Value expected (pos: 4)')
    })

    test('should throw an error in case a missing right hand side', () => {
      expect(() => parse('.a ==')).toThrow('Value expected (pos: 5)')
    })

    test('should throw an error in case a missing left and right hand side', () => {
      expect(() => parse('+')).toThrow('Value expected (pos: 0)')
      expect(() => parse(' +')).toThrow('Value expected (pos: 1)')
    })

    test('should parse a custom operator', () => {
      const options: JSONQueryParseOptions = {
        operators: { aboutEq: '~=' }
      }

      expect(parse('.score ~= 8', options)).toEqual(['aboutEq', ['get', 'score'], 8])
    })
  })

  describe('pipe', () => {
    test('should parse a pipe', () => {
      expect(parse('.friends | sort(.age)')).toEqual([
        'pipe',
        ['get', 'friends'],
        ['sort', ['get', 'age']]
      ])

      expect(parse('.friends | sort(.age) | filter(.age >= 18)')).toEqual([
        'pipe',
        ['get', 'friends'],
        ['sort', ['get', 'age']],
        ['filter', ['gte', ['get', 'age'], 18]]
      ])
    })

    test('should throw an error when a value is missing after a pipe', () => {
      expect(() => parse('.friends |')).toThrow('Value expected (pos: 10)')
    })

    test('should throw an error when a value is missing before a pipe', () => {
      expect(() => parse('| .friends ')).toThrow('Value expected (pos: 0)')
    })
  })

  describe('parentheses', () => {
    test('should parse parentheses', () => {
      expect(parse('(.friends)')).toEqual(['get', 'friends'])
      expect(parse('( .friends)')).toEqual(['get', 'friends'])
      expect(parse('(.friends )')).toEqual(['get', 'friends'])
      expect(parse('(.age == 18)')).toEqual(['eq', ['get', 'age'], 18])
      expect(parse('(42)')).toEqual(42)
      expect(parse(' ( 42 ) ')).toEqual(42)
      expect(parse('((42))')).toEqual(42)
    })

    test('should throw an error when missing closing parenthesis', () => {
      expect(() => parse('(.friends')).toThrow("Character ')' expected (pos: 9)")
    })
  })

  describe('object', () => {
    test('should parse a basic object', () => {
      expect(parse('{}')).toEqual(['object', {}])
      expect(parse('{ }')).toEqual(['object', {}])
      expect(parse('{a:1}')).toEqual(['object', { a: 1 }])
      expect(parse('{a1:1}')).toEqual(['object', { a1: 1 }])
      expect(parse('{AaZz_$019:1}')).toEqual(['object', { AaZz_$019: 1 }])
      expect(parse('{ a : 1 }')).toEqual(['object', { a: 1 }])
      expect(parse('{a:1,b:2}')).toEqual(['object', { a: 1, b: 2 }])
      expect(parse('{ a : 1 , b : 2 }')).toEqual(['object', { a: 1, b: 2 }])
      expect(parse('{ "a" : 1 , "b" : 2 }')).toEqual(['object', { a: 1, b: 2 }])
      expect(parse('{2:"two"}')).toEqual(['object', { 2: 'two' }])
      expect(parse('{null:null}')).toEqual(['object', { null: null }])
      expect(parse('{"":"empty"}')).toEqual(['object', { '': 'empty' }])
    })

    test('should parse a larger object', () => {
      expect(
        parse(`{
        name: .name,
        city: .address.city,
        averageAge: map(.age) | average()
      }`)
      ).toEqual([
        'object',
        {
          name: ['get', 'name'],
          city: ['get', 'address', 'city'],
          averageAge: ['pipe', ['map', ['get', 'age']], ['average']]
        }
      ])
    })

    test('should throw an error when missing closing parenthesis', () => {
      expect(() => parse('{a:1')).toThrow("Character '}' expected (pos: 4)")
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
      expect(() => parse('{a:')).toThrow('Value expected (pos: 3)')
      expect(() => parse('{a:2,b:}')).toThrow('Value expected (pos: 7)')
    })

    test('should throw an error in case of a trailing comma', () => {
      expect(() => parse('{a:2,}')).toThrow('Key expected (pos: 5)')
    })
  })

  describe('array', () => {
    test('should parse an array', () => {
      expect(parse('[]')).toEqual(['array'])
      expect(parse(' [ ] ')).toEqual(['array'])
      expect(parse('[1, 2, 3]')).toEqual(['array', 1, 2, 3])
      expect(parse(' [ 1 , 2 , 3 ] ')).toEqual(['array', 1, 2, 3])
      expect(parse('[(1 + 3), 2, 4]')).toEqual(['array', ['add', 1, 3], 2, 4])
      expect(parse('[2, (1 + 2), 4]')).toEqual(['array', 2, ['add', 1, 2], 4])
    })

    test('should throw an error when missing closing bracket', () => {
      expect(() => parse('[1,2')).toThrow("Character ']' expected (pos: 4)")
    })

    test('should throw an error when missing a comma', () => {
      expect(() => parse('[1 2]')).toThrow("Character ',' expected (pos: 3)")
    })

    test('should throw an error when missing a value', () => {
      expect(() => parse('[1,')).toThrow('Value expected (pos: 3)')
    })

    test('should throw an error in case of a trailing comma', () => {
      expect(() => parse('[1,2,]')).toThrow('Value expected (pos: 5)')
    })
  })

  test('should parse a string', () => {
    expect(parse('"hello"')).toEqual('hello')
    expect(parse(' "hello"')).toEqual('hello')
    expect(parse('"hello" ')).toEqual('hello')
    expect(() => parse('"hello')).toThrow('Value expected (pos: 0)')
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
  })

  test('should parse a boolean', () => {
    expect(parse('true')).toEqual(true)
    expect(parse('false')).toEqual(false)
  })

  test('should parse null', () => {
    expect(parse('null')).toEqual(null)
  })

  test('should throw an error in case of garbage at the end', () => {
    expect(() => parse('null 2')).toThrow("Unexpected part '2' (pos: 5)")
    expect(() => parse('sort() 2')).toThrow("Unexpected part '2' (pos: 7)")
  })

  test('should skip whitespace characters', () => {
    expect(parse(' \n\r\t"hello" \n\r\t')).toEqual('hello')
  })

  test('should throw when the query is empty', () => {
    expect(() => parse('')).toThrow('Value expected (pos: 0)')
  })
})
