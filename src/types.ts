export type JSONPrimitive = string | number | boolean | null

export type JSONPath = string[]

export type JSONQueryMatchOperator = '==' | '>' | '>=' | '<' | '<=' | '!=' | 'in' | 'not in'

export type JSONQueryItem = [string, ...unknown[]]

export type JSONQueryArray = JSONQueryItem[]
export type JSONQuery = JSONQueryItem | JSONQueryArray | JSONQueryObject
export type JSONQueryObject = { [key: string]: JSONQuery }

// TODO: improve typings of "...args: unknown[]" and couple it with JSONQueryItem
export type JSONQueryFunction = (data: unknown[], ...args: unknown[]) => unknown

export type MatchOperations = Record<string, (a: unknown, b: unknown) => boolean>
