export type JSONPrimitive = string | number | boolean | null

export type JSONQueryMatchOperator = '==' | '>' | '>=' | '<' | '<=' | '!='
export type JSONQueryArrayMatchOperator = 'in' | 'not in'

export type JSONQueryMatch =
  | ['match', string, JSONQueryMatchOperator, JSONPrimitive]
  | ['match', string, JSONQueryArrayMatchOperator, JSONPrimitive[]]

export type JSONQuerySort = ['sort', string] | ['sort', string, 'asc' | 'desc']

export type JSONQueryPick = ['pick', ...string[]]

export type JSONQueryLimit = ['limit', number]

export type JSONQueryCustom = [string, ...unknown[]]

export type JSONQueryItem =
  | JSONQueryMatch
  | JSONQuerySort
  | JSONQueryPick
  | JSONQueryLimit
  | JSONQueryCustom

export type JSONQueryArray = JSONQueryItem[]

export type JSONQuery = JSONQueryItem | JSONQueryArray

export type JSONQueryOperation = (data: unknown[], query: JSONQueryItem) => unknown

export type MatchOperations = Record<string, (a: unknown, b: unknown) => boolean>
