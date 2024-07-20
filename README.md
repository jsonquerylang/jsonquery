# JSONQuery

A lightweight, expandable JSON query language.

Minified and gzipped size: `0.6 kB`.

# Usage

```js
import { jsonquery } from 'josdejong/jsonquery'

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

const query = [
  ['match', 'city', '==', 'New York'],
  ['sort', 'age'],
  ['pick', 'name'],
  ['limit', 2]
]

const result = jsonquery(query, data)
// [
//   { "name": "Chris" },
//   { "name": "Sarah" }
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

const query = [{ $max: 'age' }]

const result = jsonquery(query, data, extendedOperations)
// {
//   name: 'Robert',
//   age: 45,
//   city: 'Manhattan'
// }
```

# API

```ts
function jsonquery(
  data: unknown[],
  query: JSONQuery,
  operations: JSONQueryOperation[] = all
): unknown
```

Built in operations:

- `match`
- `sort`
- `pick`
- `limit`

## License

Released under the [ISC license](LICENSE.md).
