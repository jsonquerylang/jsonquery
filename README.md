# JSONQuery

A lightweight, expandable JSON query language.

Inspired by MongoDB aggregates and Lodash.

Minified and gzipped size: `1 kB`. The reason that `jsonquery` is so small is that it smartly utilizes the built-in JSON parser, JavaScript functions, and JavaScript syntax.

# Usage

```js
import { jsonquery } from 'josdejong/jsonquery'

const data = {
  friends: [
    { name: 'Chris', age: 23, city: 'New York' },
    { name: 'Emily', age: 19, city: 'Atlanta' },
    { name: 'Joe', age: 32, city: 'New York' },
    { name: 'Kevin', age: 19, city: 'Atlanta' },
    { name: 'Michelle', age: 27, city: 'Los Angeles' },
    { name: 'Robert', age: 45, city: 'Manhattan' },
    { name: 'Sarah', age: 31, city: 'New York' }
  ]
}

const query = [
  ['get', 'friends'],
  ['match', 'city', '==', 'New York'],
  ['sort', 'age'],
  ['pick', 'name'],
  ['limit', 2]
]

const result = jsonquery(data, query)
// [
//   "Chris",
//   "Sarah"
// ]
```

The build in operations can be extended with custom operations, like `$max` in the following example:

```js
import { jsonquery, sort, all } from 'josdejong/jsonquery'

const max = (data, field) => sort(data, field, 'desc')[0]
const extendedOperations = { ...all, $max: max }

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

const query = ['max', 'age']

const result = jsonquery(data, query, extendedOperations)
// {
//   name: 'Robert',
//   age: 45,
//   city: 'Manhattan'
// }
```

# API

```ts
function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions: Record<string, JSONQueryFunction> = all
): unknown
```

Built-in functions:

- `match`
- `sort`
- `pick`
- `groupBy`
- `map`
- `limit`
- `uniq`
- `size`
- `sum`
- `prod`
- `average`
- `min`
- `max`
- `get`

## License

Released under the [ISC license](LICENSE.md).
