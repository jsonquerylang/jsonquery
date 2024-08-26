import { JSONQuery, JSONQueryOptions } from './types'
import { compile } from './compile'

export function jsonquery(data: unknown, query: JSONQuery, options?: JSONQueryOptions): unknown {
  return compile(query, options)(data)
}
