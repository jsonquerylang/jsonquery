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

export type Evaluator = (data: unknown) => unknown
export type FunctionCompiler = (
  args: unknown[],
  functions?: Record<string, FunctionCompiler>
) => Evaluator
export type Functions = Record<string, FunctionCompiler> | unknown
export type Operator = (a: unknown, b: unknown) => unknown
export type Getter = [key: string, Evaluator]
