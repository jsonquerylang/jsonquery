export type JSONPrimitive = number | boolean | null

export type JSONProperty = string | string[]

export type JSONQueryFunction = [name: string, ...args: JSONQuery[]]
export type JSONQueryOperator = [left: JSONQuery, op: string, ...right: JSONQuery[]]
export type JSONQueryArray = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery =
  | JSONQueryFunction
  | JSONQueryOperator
  | JSONQueryArray
  | JSONQueryObject
  | JSONProperty
  | JSONPrimitive

export type Getter = (item: unknown) => unknown
export type Evaluator = (data: unknown) => unknown
export type FunctionCompiler = (...args: unknown[]) => Evaluator
export type Operator = (...args: unknown[]) => unknown
