export type JSONPrimitive = string | number | boolean | null

export type JSONPath = string[]

export type JSONQueryOperatorName =
  | '=='
  | '>'
  | '>='
  | '<'
  | '<='
  | '!='
  | 'in'
  | 'not in'
  | 'regex'

export type JSONQueryFunction = [name: string, ...args: unknown[]]
export type JSONQueryOperator = [
  left: JSONQuery | JSONPrimitive,
  op: string,
  right: JSONQuery | JSONPrimitive
]
export type JSONQueryArray = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery = JSONQueryFunction | JSONQueryOperator | JSONQueryArray | JSONQueryObject

export type JSONQueryFunctionImplementation = (data: unknown, ...args: unknown[]) => unknown

export type JSONQueryOperatorImplementation = (a: unknown, b: unknown) => boolean
