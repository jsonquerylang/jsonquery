# JSONQuery

A lightweight, expandable JSON query language.

Inspired by MongoDB aggregates.

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
  { $match: { city: { $eq: 'New York' } } },
  { $sort: { age: 1 } },
  { $project: { name: 1 } },
  { $limit: 2 }
]

const result = jsonquery(query, data)
// [
//   { "name": "Chris" },
//   { "name": "Sarah" }
// ]
```

The build in operations can be extended with custom operations, like `$max` in the following example:

```js
import { jsonquery, sort, defaultOperations } from 'josdejong/jsonquery'

const max = (field, data) => sort({ [field]: -1 }, data)[0]
const extendedOperations = { ...defaultOperations, $max: max }

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
  query: JSONQuery,
  data: unknown[],
  operations: JSONQueryOperation[] = defaultOperations
): unknown
```

Built in operations:

- `$match`
- `$sort`
- `$project`
- `$limit`

## License

Released under the [ISC license](LICENSE.md).
