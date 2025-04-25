export const unquotedPropertyRegex = /^[a-zA-Z_$][a-zA-Z\d_$]*$/
export const startsWithUnquotedPropertyRegex = /^[a-zA-Z_$][a-zA-Z\d_$]*/
export const startsWithStringRegex = /^"(?:[^"\\]|\\.)*"/ // https://stackoverflow.com/a/249937/1262753
export const startsWithNumberRegex = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ // https://stackoverflow.com/a/13340826/1262753
export const startsWithIntRegex = /^(0|[1-9][0-9]*)/
export const startsWithKeywordRegex = /^(true|false|null)/
export const startsWithWhitespaceRegex = /^[ \n\t\r]+/
