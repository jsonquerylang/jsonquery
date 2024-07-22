export type JSONPrimitive = string | number | boolean | null

export type JSONPath = string[]

export type JSONQueryFilterOperator = '==' | '>' | '>=' | '<' | '<=' | '!=' | 'in' | 'not in'

export type JSONQueryFunction = [name: string, ...args: unknown[]]
export type JSONQueryArray = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery = JSONQueryFunction | JSONQueryArray | JSONQueryObject

export type JSONQueryFunctionImplementation = (data: unknown, ...args: unknown[]) => unknown

export type FilterOperations = Record<string, (a: unknown, b: unknown) => boolean>
