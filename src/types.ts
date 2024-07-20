export type JSONPrimitive = string | number | boolean | null

export type JSONPath = string[]

export type JSONQueryMatchOperator = '==' | '>' | '>=' | '<' | '<=' | '!='
export type JSONQueryArrayMatchOperator = 'in' | 'not in'

export type JSONQueryMatch =
  | ['match', string, JSONQueryMatchOperator, JSONPrimitive]
  | ['match', string, JSONQueryArrayMatchOperator, JSONPrimitive[]]
export type JSONQuerySort = ['sort', string] | ['sort', string, 'asc' | 'desc']
export type JSONQueryPick = ['pick', ...string[]]
export type JSONQueryLimit = ['limit', number]
export type JSONQueryUniq = ['uniq']
export type JSONQuerySize = ['size']
export type JSONQueryCustom = [string, ...unknown[]]

export type JSONQueryItem =
  | JSONQueryMatch
  | JSONQuerySort
  | JSONQueryPick
  | JSONQueryLimit
  | JSONQueryUniq
  | JSONQuerySize
  | JSONQueryCustom

export type JSONQueryArray = JSONQueryItem[]
export type JSONQuery = JSONQueryItem | JSONQueryArray | JSONQueryObject
export type JSONQueryObject = { [key: string]: JSONQuery }

// TODO: improve typings of "...args: unknown[]" and couple it with JSONQueryItem
export type JSONQueryFunction = (data: unknown[], ...args: unknown[]) => unknown

export type MatchOperations = Record<string, (a: unknown, b: unknown) => boolean>
