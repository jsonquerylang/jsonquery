import { expect, test } from 'vitest'
import { getSafeProperty } from './is'

test('getSafeProperty', () => {
  const obj = { value: 42 }
  expect(getSafeProperty(obj, 'value')).toEqual(42)
  expect(getSafeProperty(obj, 'foo')).toEqual(undefined)
  expect(() => getSafeProperty(obj, 'constructor')).toThrow(/Unsupported property "constructor"/)
  expect(() => getSafeProperty(obj, '__proto__')).toThrow(/Unsupported property "__proto__"/)
  expect(() => getSafeProperty(obj, 'valueOf')).toThrow(/Unsupported property "valueOf"/)

  const arr = [40, 41, 42]
  expect(getSafeProperty(arr, '2')).toEqual(42)
  expect(getSafeProperty(arr, 2)).toEqual(42)
  expect(() => getSafeProperty(arr, 'constructor')).toThrow(/Unsupported property "constructor"/)
  expect(() => getSafeProperty(arr, '__proto__')).toThrow(/Unsupported property "__proto__"/)
  expect(() => getSafeProperty(arr, 'length')).toThrow(/Unsupported property "length"/)
  expect(() => getSafeProperty(arr, 'map')).toThrow(/Unsupported property "map"/)

  expect(getSafeProperty(null, 'foo')).toEqual(undefined)
  expect(getSafeProperty(undefined, 'foo')).toEqual(undefined)
})
