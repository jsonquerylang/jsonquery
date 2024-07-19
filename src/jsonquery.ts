import type {
  JSONQuery,
  JSONQueryLimit,
  JSONQueryMatch,
  JSONQueryOperation,
  JSONQueryProject,
  JSONQuerySort,
  MatchOperations
} from './types'

export const defaultOperations = {
  $match: match,
  $sort: sort,
  $project: project,
  $limit: limit
}

export function jsonquery(
  query: JSONQuery,
  data: unknown[],
  operations: Record<string, JSONQueryOperation> = defaultOperations
): unknown {
  return query.reduce((data, queryItem) => {
    return Object.keys(queryItem).reduce((data, queryOp) => {
      const operation = operations[queryOp]
      if (!operation) {
        throw new Error(`Unknown query operation "${queryOp}"`)
      }
      return operation(queryItem[queryOp], data)
    }, data)
  }, data)
}

export function match(
  query: JSONQueryMatch,
  data: unknown[],
  operations: MatchOperations = matchOperations
): unknown[] {
  const predicate = (item: unknown) => {
    return Object.keys(query).some((key) => {
      return Object.keys(query[key]).some((op) => {
        // TODO: support nested fields
        const itemValue = item[key]
        const matchValue = query[key][op]
        const matchOp = operations[op]
        if (!matchOp) {
          throw new SyntaxError(`Unknown match operator "${op}"`)
        }
        return matchOp(itemValue, matchValue)
      })
    })
  }

  return data.filter(predicate)
}

const matchOperations: MatchOperations = {
  $eq: (a, b) => a === b,
  $gt: (a, b) => a > b,
  $gte: (a, b) => a >= b,
  $in: (a, b) => (b as Array<unknown>).includes(a),
  $lt: (a, b) => a < b,
  $lte: (a, b) => a <= b,
  $ne: (a, b) => a !== b,
  $nin: (a, b) => !(b as Array<unknown>).includes(a)
}

export function sort(query: JSONQuerySort, data: unknown[]): unknown[] {
  const compare = (a: Record<string, unknown>, b: Record<string, unknown>) => {
    const keys = Object.keys(query)
    for (const key of keys) {
      // TODO: support nested fields
      const direction = query[key]
      const aa = a[key]
      const bb = b[key]

      if (aa > bb) {
        return direction > 0 ? 1 : -1
      }

      if (aa < bb) {
        return direction < 0 ? 1 : -1
      }
    }

    return 0
  }

  return data.slice().sort(compare)
}

export function project(query: JSONQueryProject, data: unknown[]): unknown[] {
  return data.map((item) => {
    const out = {}
    Object.keys(query).forEach((key) => {
      // TODO: support nested fields
      out[key] = item[key]
    })
    return out
  })
}

export function limit(count: JSONQueryLimit, data: unknown[]): unknown[] {
  return data.slice(0, count)
}
