# JSONQuery

A lightweight, expandable JSON query language.

Inspired by MongoDB aggregates and Lodash.

Minified and gzipped size: `1 kB`. The reason that `jsonquery` is so small is that it smartly utilizes the built-in JSON parser, JavaScript functions, and JavaScript syntax.

## Usage

```js
import { jsonquery } from '@josdejong/jsonquery'

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

// get the array containing the friends from the object, filter the friends that live in New York,
// sort them by age, pick just the name out of the objects, and return the first two results.
const names = jsonquery(data, [
  ['get', 'friends'],
  ['filter', 'city', '==', 'New York'],
  ['sort', 'age'],
  ['pick', 'name'],
  ['limit', 2]
])
// [ "Chris", "Sarah" ]

// get the array containing the friends from the object, then create an object with
// properties `names`, `count`, and `averageAge` containing the results of their query:
// a list with names, the total number of array items, and the average value of the
// properties `age` in all items.
const result = jsonquery(data, [
  ['get', 'friends'],
  {
    names: ['pick', 'name'],
    count: ['size'],
    averageAge: [['pick', 'age'], ['average']]
  }
])
// {
//   names: ['Chris', 'Emily', 'Joe', 'Kevin', 'Michelle', 'Robert', 'Sarah'],
//   count: 7,
//   averageAge: 28
// }
```

The build in functions can be extended with custom functions, like `times` in the following example:

```js
import { jsonquery, all } from '@josdejong/jsonquery'

const times = (data: number[], value: number) => data.map((item) => item * value)
const functions = { ...all, times }

const data = [1, 2, 3]
const query = ['times', 3]
const result = jsonquery(data, query, functions)
// [2, 4, 6]
```

## API

The `jsonquery` library has one core function `jsonquery(data, query, functions)`, where you pass the data, the query, and optionally an object with custom or extended functions.

```ts
function jsonquery(
  data: unknown,
  query: JSONQuery,
  functions: Record<string, JSONQueryFunction> = all
): unknown

type JSONQueryItem = [name: string, ...args: unknown[]]
type JSONQueryArray = JSONQuery[]
type JSONQueryObject = { [key: string]: JSONQuery }
type JSONQuery = JSONQueryItem | JSONQueryArray | JSONQueryObject

type JSONQueryFunction = (data: unknown[], ...args: unknown[]) => unknown
```

At the core of the query language `JSONQuery`, we have a `JSONQueryItem` which is an array with a function name as first argument, followed by optional function arguments. The following example will take an input array, sort the objects in the array by the property `age`, and return the result:

```
['sort', 'age']
```

Multiple query items can be put in an array, a pipeline, which will execute the query functions one by one and pass the output of the first to the input of the next. The following example will first filter the items of an array that have a property `city` with the value `"New York""`, and next, sort the filtered items by the property `age`:

```
[
  ['filter', 'city', '==', 'New York'],
  ['sort', 'age']
]
```

Lastly, you can define a `JSONQueryObject` which is an object with property names as keys, and a JSONQuery as value. The following example will output an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

```
{
  names: ['pick', 'name'],
  count: ['size'],
  averageAge: [
    ['pick', 'age'],
    ['average']
  ]
}
```

Note arrays and objects can contain nested arrays and objects.

### Built-in functions:

- `get`
- `filter`
- `sort`
- `pick`
- `map`
- `limit`
- `groupBy`
- `flatten`
- `uniq`
- `uniqBy`
- `size`
- `sum`
- `prod`
- `average`
- `min`
- `max`

## License

Released under the [ISC license](LICENSE.md).
