import { compile } from './compile'
import { isString } from './is'
import { parse } from './parse'
import type { JSONQuery, JSONQueryOptions } from './types'

export function jsonquery(
  data: unknown,
  query: string | JSONQuery,
  options?: JSONQueryOptions
): unknown {
  return compile(isString(query) ? parse(query, options) : query, options)(data)
}

export { compile } from './compile'
export { stringify } from './stringify'
export { parse } from './parse'
export { buildFunction } from './functions'

export * from './types'
