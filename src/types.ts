export type JSONPrimitive = string | number | boolean | null

export type JSONQueryMatch = Record<
  string,
  {
    $eq?: JSONPrimitive
    $gt?: JSONPrimitive
    $gte?: JSONPrimitive
    $in?: Array<JSONPrimitive>
    $lt?: JSONPrimitive
    $lte?: JSONPrimitive
    $ne?: JSONPrimitive
    $nin?: JSONPrimitive[]
  }
>

export type JSONQuerySort = Record<string, 1 | -1>

export type JSONQueryProject = Record<string, 1>

export type JSONQueryLimit = number

export type JSONQuery = Array<{
  $match?: JSONQueryMatch
  $sort?: JSONQuerySort
  $project?: JSONQueryProject
  $limit?: JSONQueryLimit
  [op: string]: unknown
}>

export type JSONQueryOperation = (query: unknown, data: unknown[]) => unknown

export type MatchOperations = Record<string, (a: unknown, b: unknown) => boolean>
