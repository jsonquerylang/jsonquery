export type JSONPrimitive = string | number | boolean | null

export type JSONPath = string[]
export type JSONProperty = JSONPath | string

export type JSONFilterCondition =
  | [left: JSONFilterCondition, 'and' | 'or', right: JSONFilterCondition]
  | [left: JSONProperty, op: JSONFilterOperatorName, right: JSONPrimitive]
  | [left: JSONProperty, op: JSONFilterOperatorName, right: JSONProperty]
  | [
      left: number | boolean | null | ['string', string],
      op: JSONFilterOperatorName,
      right: JSONProperty
    ]

export type JSONFilterOperatorName =
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
export type JSONQueryArray = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery = JSONQueryFunction | JSONQueryArray | JSONQueryObject

export type JSONQueryFunctionImplementation = (data: unknown, ...args: unknown[]) => unknown

export type JSONQueryOperatorImplementation = (a: unknown, b: unknown) => unknown
