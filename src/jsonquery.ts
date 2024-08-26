import { JSONQuery, JSONQueryOptions } from './types'
import { compile } from './compile'
export { compile } from './compile'

export function jsonquery(data: unknown, query: JSONQuery, options?: JSONQueryOptions): unknown {
  const compiled = compile(query, options)

  return compiled(data)
}
