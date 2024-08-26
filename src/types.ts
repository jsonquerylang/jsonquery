export type JSONPrimitive = number | boolean | null

export type JSONProperty = string
export type JSONPath = JSONProperty[]

export type JSONQueryFunction = [name: string, ...args: JSONQuery[]]
export type JSONQueryOperator = [left: JSONQuery, op: string, ...right: JSONQuery[]]
export type JSONQueryPipe = JSONQuery[]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQuery =
  | JSONQueryFunction
  | JSONQueryOperator
  | JSONQueryPipe
  | JSONQueryObject
  | JSONPath
  | JSONProperty
  | JSONPrimitive

export interface JSONQueryOptions {
  functions?: FunctionsMap
}

export type Evaluator = (data: unknown) => unknown
export type FunctionCompiler = (...args: unknown[]) => Evaluator
export type FunctionsMap = Record<string, FunctionCompiler> | unknown
export type Operator = (a: unknown, b: unknown) => unknown
export type Getter = [key: string, Evaluator]
