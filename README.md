# JSONQuery

A lightweight, expandable JSON query language.

## Features

- Small (just `1 kB` when minified and gzipped!)
- Expressive
- Easy to understand and remember
- Serializable (it is JSON)
- Feature rich
- Expandable

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
  times: (data, value) => data.map((item) => item * value)
}

const data = [1, 2, 3]
const result = jsonquery(data, ['times', 3], customFunctions)
// [3, 6, 9]
```

## API

The `jsonquery` library has one core function `jsonquery(data, query, functions)`, where you pass the data, the query, and optionally an object with custom functions to extend the built-in functions.

```ts
function jsonquery(
  data: unknown,
  query: JSONQuery,
  customFunctions?: Record<string, JSONQueryFunctionImplementation>
): unknown

type JSONQueryFunction = [name: string, ...args: unknown[]]
type JSONQueryArray = JSONQuery[]
type JSONQueryObject = { [key: string]: JSONQuery }
type JSONQuery = JSONQueryFunction | JSONQueryArray | JSONQueryObject

type JSONQueryFunctionImplementation = (data: unknown[], ...args: unknown[]) => unknown
```

At the core of the query language `JSONQuery`, we have a `JSONQueryFunction` which is an array with a function name as first argument, followed by optional function arguments. The following example will look up the `sort` function and then call it like `sort(data, 'age')`. Here, `data` is the input and should be an array with objects which will be sorted by the property `age`:

```json
["sort", "age"]
```

Multiple query functions can be put in an array, a pipeline, which will execute the query functions one by one and pass the output of the first to the input of the next. The following example will first filter the items of an array that have a property `city` with the value `"New York""`, and next, sort the filtered items by the property `age`:

```json
[
  ["filter", "city", "==", "New York"],
  ["sort", "age"]
]
```

Lastly, you can define a `JSONQueryObject` which is an object with property names as keys, and a JSONQuery as value. The following example will output an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

```json
{
  "names": ["pick", "name"],
  "count": ["size"],
  "averageAge": [["pick", "age"], ["average"]]
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
- `keyBy`
- `keys`
- `values`
- `flatten`
- `uniq`
- `uniqBy`
- `size`
- `sum`
- `prod`
- `average`
- `min`
- `max`

## Motivation

There are many powerful query languages out there, so why the need to develop `jsonquery`? There are a couple of reasons for this.

1.  **Syntax**

    Most JSON query languages have a syntax that is simple for very basic queries, but complex for more advanced queries. Their syntax is typically very compact but includes special characters and notations (like `@`, `$`, `|`, `?`, `:`, `*`, `&`), almost feeling like Regex which is infamously hard to read. The syntax is hard to remember unless you use the query language on a daily basis.

2.  **Size**

    Most of the JSON query languages are quite big when looking at the bundle size. This can make them unsuitable for use in a web application where every kilobyte counts.

3.  **Expressiveness**

    The expressiveness of most query languages is limited. Since a long time, my favorite JSON query language is JavaScript+Lodash because it is so flexible. The downside however is that it is not safe to store or share queries written in JavaScript from a security point of view.

The `jsonquery` language is inspired by [JavaScript+Lodash](https://jsoneditoronline.org/indepth/query/10-best-json-query-languages/#javascript) and by [MongoDB aggregates](https://www.mongodb.com/docs/manual/aggregation/). It is basically a JSON notation to describe making a series of function calls. It has no magic syntax except for the need to be familiar with JSON, making it flexible and easy to understand. The library is extremely small thanks to smartly utilizing built-in JavaScript functions and the built-in JSON parser, requiring very little code to make the query language work.

## License

Released under the [ISC license](LICENSE.md).
