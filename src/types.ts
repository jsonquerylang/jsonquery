export type JSONPrimitive = string | number | boolean | null

export type JSONProperty = string[]

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
export type JSONQueryOperator = [left: string, op: string, ...right: unknown[]]
export type JSONQueryArray = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery =
  | JSONQueryFunction
  | JSONQueryOperator
  | JSONQueryArray
  | JSONQueryObject
  | JSONProperty
  | JSONPrimitive

export type Evaluator = ((data: unknown) => unknown) | JSONProperty
export type FunctionCompiler = (...args: unknown[]) => Evaluator
export type Operator = (...args: unknown[]) => unknown
