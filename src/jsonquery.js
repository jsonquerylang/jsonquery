/**
 * @typedef JSONPrimitive = string | number | boolean | null
 *
 * @typedef JSONQueryMatch = Object.<string, {
 *   $eq?: JSONPrimitive,
 *   $gt?: JSONPrimitive,
 *   $gte?: JSONPrimitive,
 *   $in?: Array<JSONPrimitive>,
 *   $lt?: JSONPrimitive,
 *   $lte?: JSONPrimitive,
 *   $ne?: JSONPrimitive,
 *   $nin?: JSONPrimitive[],
 * }>
 *
 * @typedef JSONQuerySort = Object.<string, 1 | -1>
 *
 * @typedef JSONQueryProject = Object.<string, 1>
 *
 * @typedef JSONQueryLimit = number
 *
 * @typedef JSONQuery {Array<{
 *   $match?: JSONQueryMatch,
 *   $sort?: JSONQuerySort,
 *   $project?: JSONQueryProject,
 *   $limit?: JSONQueryLimit
 * }>}
 *
 * @typedef JSONQueryOperation = (query: unknown, data: unknown[]) => unknown[]
 */

export const defaultOperations = {
  $match: match,
  $sort: sort,
  $project: project,
  $limit: limit
}

/**
 * @param {JSONQuery} query
 * @param {unknown[]} data
 * @param {Object.<string, JSONQueryOperation>} [operations]
 * @return {unknown[]}
 */
export function jsonquery(query, data, operations = defaultOperations) {
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

/**
 * Filter an array
 * @param {JSONQueryMatch} query
 * @param {unknown[]} data
 * @param {Object.<string, (a, b) => boolean>} [operations]
 * @returns {unknown[]}
 */
export function match(query, data, operations = matchOperations) {
  const predicate = (item) => {
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

const matchOperations = {
  $eq: (a, b) => a === b,
  $gt: (a, b) => a > b,
  $gte: (a, b) => a >= b,
  $in: (a, b) => b.includes(a),
  $lt: (a, b) => a < b,
  $lte: (a, b) => a <= b,
  $ne: (a, b) => a !== b,
  $nin: (a, b) => !b.includes(a)
}

/**
 * Sort an array
 * @param {JSONQuerySort} query
 * @param {unknown[]} data
 * @return {unknown[]}
 */
export function sort(query, data) {
  const compare = (a, b) => {
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

/**
 * Project (map) an array
 * @param {JSONQueryProject} query
 * @param {unknown[]} data
 * @returns {unknown[]}
 */
export function project(query, data) {
  return data.map((item) => {
    const out = {}
    Object.keys(query).forEach((key) => {
      // TODO: support nested fields
      out[key] = item[key]
    })
    return out
  })
}

/**
 * @param {JSONQueryLimit} count
 * @param {unknown[]} data
 * @return {unknown[]}
 */
export function limit(count, data) {
  return data.slice(0, count)
}
