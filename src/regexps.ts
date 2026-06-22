export const unquotedPropertyRegex = /^[\p{L}\p{Nl}_][\p{L}\p{Nl}\p{Nd}\p{Mn}\p{Mc}\p{Pc}_$]*$/u
export const startsWithUnquotedPropertyRegex = /^[\p{L}\p{Nl}_][\p{L}\p{Nl}\p{Nd}\p{Mn}\p{Mc}\p{Pc}_$]*/u
export const startsWithStringRegex = /^"(?:[^"\\]|\\.)*"/ // https://stackoverflow.com/a/249937/1262753
export const startsWithNumberRegex = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/ // https://stackoverflow.com/a/13340826/1262753
export const startsWithIntRegex = /^(0|[1-9][0-9]*)/
export const startsWithKeywordRegex = /^(true|false|null)/
export const startsWithWhitespaceRegex = /^[ \n\t\r]+/
