import { FunctionsMap, JSONQuery } from './types'
import { compile } from './compile'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  customFunctions?: FunctionsMap
): unknown {
  const compiled = compile(query, customFunctions)

  return compiled(data)
}
