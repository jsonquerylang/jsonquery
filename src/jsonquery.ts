import { JSONQuery, JSONQueryCompileOptions } from './types'
import { compile } from './compile'

export function jsonquery(
  data: unknown,
  query: JSONQuery,
  options?: JSONQueryCompileOptions
): unknown {
  return compile(query, options)(data)
}
