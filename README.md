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

The build in functions can be extended with custom functions, like `times` in the following example:

```js
import { jsonquery, all } from 'josdejong/jsonquery'

const times = (data: number[], value: number) => data.map((item) => item * value)
const functions = { ...all, times }

const data = [1, 2, 3]
const query = ['times', 3]
const result = jsonquery(data, query, functions)
// [2, 4, 6]
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
- `keyBy`
- `groupBy`
- `map`
- `flatten`
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
