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
  operators?: Record<string, string>
}

export interface JSONQueryCompileOptions {
  functions?: FunctionBuildersMap
}

export interface JSONQueryStringifyOptions {
  operators?: Record<string, string>
  maxLineLength?: number
  indentation?: string
}

export interface JSONQueryParseOptions {
  functions?: Record<string, boolean> | FunctionBuildersMap
  operators?: Record<string, string>
}

export type Fun = (data: unknown) => unknown
export type FunctionBuilder = (...args: JSONQuery[]) => Fun
export type FunctionBuildersMap = Record<string, FunctionBuilder>
export type Getter = [key: string, Fun]

export interface Entry<T> {
  key: string
  value: T
}
