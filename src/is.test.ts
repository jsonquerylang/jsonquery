import { expect, test } from 'vitest'
import { getSafeProperty, isSafeProperty } from './is'

test('isSafeProperty', () => {
  const obj = { value: 42 }
  expect(isSafeProperty(obj, 'prop')).toEqual(true)
  expect(isSafeProperty(obj, 'toString')).toEqual(false)
  expect(isSafeProperty(obj, 'constructor')).toEqual(false)
  expect(isSafeProperty(obj, '__proto__')).toEqual(false)

  const createdObj = Object.create(obj)
  expect(isSafeProperty(createdObj, 'value')).toEqual(true)
  expect(isSafeProperty(createdObj, 'toString')).toEqual(false)
  expect(isSafeProperty(createdObj, 'constructor')).toEqual(false)
  expect(isSafeProperty(createdObj, '__proto__')).toEqual(false)

  const arr = [40, 41, 42]
  expect(isSafeProperty(arr, '1')).toEqual(true)
  expect(isSafeProperty(arr, 1)).toEqual(true)
  expect(isSafeProperty(arr, 'constructor')).toEqual(false)
  expect(isSafeProperty(arr, '__proto__')).toEqual(false)
  expect(isSafeProperty(arr, 'length')).toEqual(false) // TODO: we could consider this safe

  class TestClass {
    value = 42
  }
  const t = new TestClass()
  expect(isSafeProperty(t, 'value')).toEqual(false) // We don't support classes, only plain JSON
  expect(isSafeProperty(t, 'foo')).toEqual(false)
  expect(isSafeProperty(t, 'constructor')).toEqual(false)
  expect(isSafeProperty(t, '__proto__')).toEqual(false)

  expect(isSafeProperty(function foo() {}, 'name')).toEqual(false)
})

test('getSafeProperty', () => {
  const obj = { value: 42 }
  expect(getSafeProperty(obj, 'value')).toEqual(42)
  expect(getSafeProperty(obj, 'foo')).toEqual(undefined)
  expect(() => getSafeProperty(obj, 'constructor')).toThrow(/Unsafe property "constructor"/)
  expect(() => getSafeProperty(obj, '__proto__')).toThrow(/Unsafe property "__proto__"/)

  const arr = [40, 41, 42]
  expect(getSafeProperty(arr, '2')).toEqual(42)
  expect(getSafeProperty(arr, 2)).toEqual(42)
  expect(() => getSafeProperty(arr, 'constructor')).toThrow(/Unsafe property "constructor"/)
  expect(() => getSafeProperty(arr, '__proto__')).toThrow(/Unsafe property "__proto__"/)
  expect(() => getSafeProperty(arr, 'length')).toThrow(/Unsafe property "length"/)

  expect(getSafeProperty(null, 'foo')).toEqual(undefined)
  expect(getSafeProperty(undefined, 'foo')).toEqual(undefined)
})
