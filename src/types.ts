export type JSONQueryPipe = JSONQuery[]
export type JSONQueryFunction = [name: string, ...args: JSONQuery[]]
export type JSONQueryObject = { [key: string]: JSONQuery }
export type JSONQueryPrimitive = string | number | boolean | null
export type JSONQuery = JSONQueryFunction | JSONQueryPipe | JSONQueryObject | JSONQueryPrimitive

export type JSONProperty = string
export type JSONPath = JSONProperty[]
export type JSONQueryProperty = ['get', path: string | JSONPath]

export interface JSONQueryOptions {
  functions?: FunctionBuildersMap
}

export type Function = (data: unknown) => unknown
export type FunctionBuilder = (...args: JSONQuery[]) => Function
export type FunctionBuildersMap = Record<string, FunctionBuilder>
export type Getter = [key: string, Function]
