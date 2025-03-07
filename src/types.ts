export type JSONQueryPipe = JSONQuery[]
export type JSONQueryFunction = [name: string, ...args: JSONQuery[]]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQueryPrimitive = string | number | boolean | null
export type JSONQuery = JSONQueryFunction | JSONQueryPipe | JSONQueryObject | JSONQueryPrimitive

export type JSONProperty = string
export type JSONPath = JSONProperty[]
export type JSONQueryProperty = ['get', path?: string | JSONPath]

export interface JSONQueryOptions {
  functions?: FunctionBuildersMap
  operators?: CustomOperator[]
}

export interface JSONQueryCompileOptions {
  functions?: FunctionBuildersMap
}

export interface JSONQueryStringifyOptions {
  operators?: CustomOperator[]
  maxLineLength?: number
  indentation?: string
}

export interface JSONQueryParseOptions {
  functions?: Record<string, boolean> | FunctionBuildersMap
  operators?: CustomOperator[]
}

export type Fun = (data: unknown) => unknown
export type FunctionBuilder = (...args: JSONQuery[]) => Fun
export type FunctionBuildersMap = Record<string, FunctionBuilder>
export type Getter = [key: string, Fun]
export type OperatorGroup = Record<string, string>
export type CustomOperator =
  | { name: string; op: string; at: string }
  | { name: string; op: string; after: string }
  | { name: string; op: string; before: string }

export interface Entry<T> {
  key: string
  value: T
}
