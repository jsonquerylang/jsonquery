import { describe, expect, test } from 'vitest'
import { extendOperators } from './operators'

describe('operators', () => {
  test('should extend operators (at)', () => {
    const ops = [{ add: '+', subtract: '-' }, { eq: '==' }]

    expect(extendOperators(ops, [{ name: 'aboutEq', op: '~=', at: '==' }])).toEqual([
      { add: '+', subtract: '-' },
      { eq: '==', aboutEq: '~=' }
    ])
  })

  test('should extend operators (after)', () => {
    const ops = [{ add: '+', subtract: '-' }, { eq: '==' }]

    expect(extendOperators(ops, [{ name: 'aboutEq', op: '~=', after: '+' }])).toEqual([
      { add: '+', subtract: '-' },
      { aboutEq: '~=' },
      { eq: '==' }
    ])
  })

  test('should extend operators (before)', () => {
    const ops = [{ add: '+', subtract: '-' }, { eq: '==' }]

    expect(extendOperators(ops, [{ name: 'aboutEq', op: '~=', before: '==' }])).toEqual([
      { add: '+', subtract: '-' },
      { aboutEq: '~=' },
      { eq: '==' }
    ])
  })

  test('should extend operators (multiple consecutive)', () => {
    const ops = [{ add: '+', subtract: '-' }, { eq: '==' }]

    expect(
      extendOperators(ops, [
        { name: 'first', op: 'op1', before: '==' },
        { name: 'second', op: 'op2', before: 'op1' }
      ])
    ).toEqual([{ add: '+', subtract: '-' }, { second: 'op2' }, { first: 'op1' }, { eq: '==' }])
  })
})
