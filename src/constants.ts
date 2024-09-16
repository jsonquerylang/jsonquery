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
export const unquotedPropertyRegex = /^[A-z_$][A-z\d_$]*$/
export const startsWithUnquotedPropertyRegex = /^[A-z_$][A-z\d_$]*/
export const startsWithStringRegex = /^"(?:[^"\\]|\\.)*"/ // https://stackoverflow.com/a/249937/1262753
export const startsWithNumberRegex = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ // https://stackoverflow.com/a/13340826/1262753
export const startsWithKeywordRegex = /^(true|false|null)/
export const startsWithWhitespaceRegex = /^[ \n\t\r]+/
