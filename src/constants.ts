export const operators = {
  and: 'and',
  or: 'or',

  eq: '==',
  gt: '>',
  gte: '>=',
  lt: '<',
  lte: '<=',
  ne: '!=',

  add: '+',
  subtract: '-',
  multiply: '*',
  divide: '/',
  pow: '^',
  mod: '%'
}

// TODO: think through the exact conditions for unquoted properties
export const alphaCharacterRegex = /^[A-z_$]$/
export const alphaDigitCharacterRegex = /^[A-z0-9_$]$/
export const unquotedPropertyRegex = /^[A-z_$][A-z0-9_$]+$/
