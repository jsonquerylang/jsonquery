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
export const alphaDigitCharacterRegex = /^[A-z\d_$]$/
export const unquotedPropertyRegex = /^[A-z_$][A-z\d_$]+$/
export const startsWithUnquotedPropertyRegex = /^[A-z_$][A-z\d_$]+/
export const startsWithNumberRegex = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ // https://stackoverflow.com/questions/13340717/json-numbers-regular-expression
export const startsWithKeywordRegex = /^(true|false|null)/
export const whitespaceRegex = /^[ \n\t\r]$/
