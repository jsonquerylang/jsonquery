# JSONQuery

A lightweight, expandable JSON query language.

Inspired by MongoDB aggregates and Lodash.

Minified and gzipped size: `1 kB`. The reason that `jsonquery` is so small is that it smartly utilizes the built-in JSON parser, JavaScript functions, and JavaScript syntax.

## Install

```
npm install @josdejong/jsonquery
```

## Use

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
// sort them by age, and pick just the name and age out of the objects.
const names = jsonquery(data, [
  ['get', 'friends'],
  ['filter', 'city', '==', 'New York'],
  ['sort', 'age'],
  ['pick', 'name', 'age']
])
// [
//   { name: 'Chris', age: 23 },
//   { name: 'Sarah', age: 31 },
//   { name: 'Joe', age: 32 }
// ]

// get the array containing the friends from the object, then create an object with
// properties `names`, `count`, and `averageAge` containing the results of their query:
// a list with names, the total number of array items, and the average value of the
// properties `age` in all items.
const result = jsonquery(data, [
  ['get', 'friends'],
  {
    names: ['get', 'name'],
    count: ['size'],
    averageAge: [['get', 'age'], ['average']]
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
import { jsonquery } from '@josdejong/jsonquery'

const customFunctions = {
  times: (data: number[], value: number) => data.map((item) => item * value)
}

const data = [1, 2, 3]
const query = ['times', 3]
const result = jsonquery(data, query, customFunctions)
// [2, 4, 6]
```

## API

The `jsonquery` library has one core function `jsonquery(data, query, functions)`, where you pass the data, the query, and optionally an object with custom functions to extend the built-in functions.

```ts
function jsonquery(
  data: unknown,
  query: JSONQuery,
  customFunctions?: Record<string, JSONQueryFunction>
): unknown

type JSONQueryItem = [name: string, ...args: unknown[]]
type JSONQueryArray = JSONQuery[]
type JSONQueryObject = { [key: string]: JSONQuery }
type JSONQuery = JSONQueryItem | JSONQueryArray | JSONQueryObject

type JSONQueryFunction = (data: unknown[], ...args: unknown[]) => unknown
```

At the core of the query language `JSONQuery`, we have a `JSONQueryItem` which is an array with a function name as first argument, followed by optional function arguments. The following example will look up the `sort` function and then call it like `sort(data, 'age')`. Here, `data` is the input and should be an array with objects which will be sorted by the property `age`:

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
