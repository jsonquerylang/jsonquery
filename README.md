# JSON Query

![JSON Query Logo](https://jsonquerylang.org/frog-756900-100.png)

A small, flexible, and expandable JSON query language.

Try it out on the online playground: <https://jsonquerylang.org>

![JSON Query Overview](https://jsonquerylang.org/jsonquery-overview.svg)

## Features

- Small (just `1.4 kB` when minified and gzipped!)
- Feature rich (40+ powerful functions)
- Serializable (it is JSON)
- Easy to parse
- Expressive
- Expandable

## Documentation

On this page:

- [Installation](#installation)
- [Usage](#usage)
- [Syntax](#syntax)
- [JavaScript API](#javascript-api)
- [Gotchas](#gotchas)
- [Development](#development)
- [Motivation](#motivation)
- [License](#license)

External pages:

- [Function reference](reference/functions.md)

## Installation

```
npm install @jsonquerylang/jsonquery
```

## Usage

```js
import { jsonquery } from '@jsonquerylang/jsonquery'

const data = {
  "friends": [
    { "name": "Chris", "age": 23, "city": "New York" },
    { "name": "Emily", "age": 19, "city": "Atlanta" },
    { "name": "Joe", "age": 32, "city": "New York" },
    { "name": "Kevin", "age": 19, "city": "Atlanta" },
    { "name": "Michelle", "age": 27, "city": "Los Angeles" },
    { "name": "Robert", "age": 45, "city": "Manhattan" },
    { "name": "Sarah", "age": 31, "city": "New York" }
  ]
}

// get the array containing the friends from the object, filter the friends that live in New York,
// sort them by age, and pick just the name and age out of the objects.
const names = jsonquery(data, [
  ["get", "friends"],
  ["filter", ["eq", ["get", "city"], "New York"]],
  ["sort", ["get", "age"]],
  ["pick", ["get", "name"], ["get", "age"]]
])
// names = [
//   { "name": "Chris", "age": 23 },
//   { "name": "Sarah", "age": 31 },
//   { "name": "Joe", "age": 32 }
// ]

// get the array containing the friends from the object, then create an object with
// properties `names`, `count`, and `averageAge` containing the results of their query:
// a list with names, the total number of array items, and the average value of the
// properties `age` in all items.
const result = jsonquery(data, [
  ["get", "friends"],
  {
    "names": ["map", ["get", "name"]],
    "count": ["size"],
    "averageAge": [
      ["map", ["get", "age"]],
      ["average"]
    ]
  }
])
// result = {
//   "names": ["Chris", "Emily", "Joe", "Kevin", "Michelle", "Robert", "Sarah"],
//   "count": 7,
//   "averageAge": 28
// }

// use mathematical functions like add, subtract, multiply and divide to do calculations
const shoppingCart = [
  { "name": "bread", "price": 2.5, "quantity": 2 },
  { "name": "milk", "price": 1.2, "quantity": 3 }
]
const totalPrice = jsonquery(shoppingCart, [
  ["map", ["multiply", ["get", "price"], ["get", "quantity"]]],
  ["sum"]
])
// totalPrice = 8.6
```

The build in functions can be extended with custom functions, like `times` in the following example:

```js
import { jsonquery } from '@jsonquerylang/jsonquery'

const customFunctions = {
  times: (value) => (data) => data.map((item) => item * value)
}

const data = [1, 2, 3]
const result = jsonquery(data, ["times", 3], customFunctions)
// [3, 6, 9]
```

## Syntax

The `jsonquery` query language is written in JSON and has the following building blocks: _functions_, _pipes_, and _objects_. When writing a JSON Query, you compose a ["pipe"](https://medium.com/@efeminella/the-pipe-operator-a-glimpse-into-the-future-of-functional-javascript-7ebb578887a4) or a ["chain"](https://en.wikipedia.org/wiki/Method_chaining) of operations to be applied to the data. It resembles chaining like in [Lodash](https://lodash.com/docs/4.17.15#chain) or just [in JavaScript](https://medium.com/backticks-tildes/understanding-method-chaining-in-javascript-647a9004bd4f) itself using methods like `map` and `filter`.

The examples in the following section are based on querying the following data:

```json
[
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Joe", "age": 32, "address": { "city": "New York" } },
  { "name": "Kevin", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
  { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
  { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
]
```
Syntax overview:

| Category               | Syntax                                    | Example                                        |
|------------------------|-------------------------------------------|------------------------------------------------|
| [Function](#functions) | `[name, argument1, argument2, ...]`       | `["sort", ["get", "age"], "asc"]`              |
| [Pipe](#pipes)         | `[query1, query1, ...]`                   | `[["sort", "age"], ["pick", "name", "age"]]`   |
| [Object](#objects)     | `{"prop1": query1, "prop2": query2, ...}` | `{"names": ["map", "name"], "total": ["sum"]}` |

The following sections explain the syntax in more detail.

### Functions

At the core of the query language, we have a _function_ call which described by an array with the function name as first item followed by optional function arguments. The following example will look up the `sort` function and then call it like `sort(data, (item) => item.age, 'asc')`. Here, `data` is the input and should be an array with objects which will be sorted in ascending by the property `age`:

```json
["sort", ["get", "age"], "asc"]
```

An important function is the function `get`. It allows to get a property from an object:

```json
["get", "age"]
```

A nested property can be retrieved by specifying multiple properties. The following path for example describes the value of a nested property `city` inside an object `address`:

```json
["get", "address", "city"]
```

To get the current value itself, just specify `["get"]` without properties:

```json
["multiply", ["get"], 2]
```

See section [Function reference](reference/functions.md) for a detailed overview of all available functions.

### Pipes

A _pipe_ is an array containing a series of _functions_, _objects_, or _pipes_. The entries in the pipeline are executed one by one, and the output of the first is the input for the next. The following example will first filter the items of an array that have a nested property `city` in the object `address` with the value `"New York"`, and next, sort the filtered items by the property `age`:

```json
[
  ["filter", ["eq", ["get" ,"address", "city"], "New York"]],
  ["sort", ["get" ,"age"]]
]
```

### Objects

An _object_ is defined as a regular JSON object with a property name as key, and a _function_, _pipe_, or _object_ as value. Objects can be used to transform data or to execute multiple query pipelines in parallel.

The following example will map over the items of the array and create a new object with properties `firstName` and `city` for every item:

```json
["map", {
  "firstName": ["get", "name"],
  "city": ["get", "address", "city"]
}]
```

The following example will output an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

```json
{
  "names": ["map", ["get", "name"]],
  "count": ["size"],
  "averageAge": [
    ["map", ["get", "age"]], 
    ["average"]
  ]
}
```

## JavaScript API

### jsonquery

The `jsonquery` library has one core function where you pass the data, the query, and optionally an object with custom functions to extend the built-in functions:

```
jsonquery(data: JSON, query: JSONQuery, options: JSONQueryOptions) : JSON
```

Here:

- `data` is the JSON document that will be queried, often an array with objects.
- `query` is a JSON document containing a JSON query as described in the section below.
- `options` is an optional object that can contain the following properties:
  - `functions` is an optional map with custom function creators. A function creator has optional arguments as input and must return a function that can be used to process the query data. For example:

      ```js
      const options = {
        functions: {
          // usage example: ["times", 3]
          times: (value) => (data) => data.map((item) => item * value)
        }
      }
      ```

      If the parameters are not a static value but can be a query themselves, the function `compile` can be used to compile them. For example, the actual implementation of the function `filter` is the following:

      ```js
      const options = {
        functions: {
          // usage example: ["filter", ["age", ">", 20 ]]
          filter: (predicate) => {
            const _predicate = compile(predicate)
            return (data) => data.filter(_predicate)
          }
        }
      } 
      ```

      You can have a look at the source code of the functions in `/src/functions.ts` for more examples.

Here an example of using the function `jsonquery`:

```js
import { jsonquery } from '@jsonquerylang/jsonquery'

const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 19 },
  { "name": "Joe", "age": 32 }
]

const result = jsonquery(data, ["filter", ["gt", ["get", "age"], 20]])
// result = [
//   { "name": "Chris", "age": 23 },
//   { "name": "Joe", "age": 32 }
// ]
```

### compile

The JavaScript library also exports a `compile` function:

```
compile(query: JSONQuery, options: JSONQueryOptions) => (data: JSON) => JSON
```

Example:

```js
import { compile } from '@jsonquerylang/jsonquery'

const queryIt = compile(["filter", ["gt", ["get", "age"], 20]])

const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 19 },
  { "name": "Joe", "age": 32 }
]

const result = queryIt(data)
// result = [
//   { "name": "Chris", "age": 23 },
//   { "name": "Joe", "age": 32 }
// ]
```

### error handling

When executing a query throws an error, the library attaches a stack to the error message which can give insight in what went wrong. The stack can be found at the property `error.jsonquery` and has type `Array<{ data: unknown, query: JSONQuery }>`.

```js
const data = {
  "participants": [
    { "name": "Chris", "age": 23, "scores": [7.2, 5, 8.0] },
    { "name": "Emily", "age": 19 },
    { "name": "Joe", "age": 32, "scores": [6.1, 8.1] }
  ]
}

try {
  jsonquery(data, [
    ["get", "participants"],
    ["map", [["get", "scores"], ["sum"]]]
  ])
} catch (err) {
  console.log(err.jsonquery)
  // error stack:
  // [
  //   {
  //     "data": {
  //       "participants": [
  //         { "name": "Chris", "age": 23, "scores": [7.2, 5, 8.0] },
  //         { "name": "Emily", "age": 19 },
  //         { "name": "Joe", "age": 32, "scores": [6.1, 8.1] }
  //       ]
  //     },
  //     "query": [
  //       ["get", "participants"],
  //       ["map", [["get", "scores"], ["sum"]]]
  //     ]
  //   },
  //   {
  //     "data": [
  //       { "name": "Chris", "age": 23, "scores": [7.2, 5, 8.0] },
  //       { "name": "Emily", "age": 19 },
  //       { "name": "Joe", "age": 32, "scores": [6.1, 8.1] }
  //     ],
  //     "query": ["map", [["get", "scores"], ["sum"]]]
  //   },
  //   {
  //     "data": { "name": "Emily", "age": 19 },
  //     "query": [["get", "scores"], ["sum"]]
  //   },
  //   {
  //     "data" : undefined,
  //     "query": ["sum"]
  //   }
  // ]
}
```

## Gotchas

The JSON Query language has some gotchas. What can be confusing at first is to understand how data is piped through the query. A traditional function call is for example `max(myValues)`, so you may expect to have to write this in JSON Query like `["max", "myValues"]`. However, JSON Query has a functional approach where we create a pipeline like: `data -> max -> result`. So, you will have to write a pipe first getting this property and then calling abs: `[["get", "myValues"], ["max"]]"`.

It's easy to forget to specify a property getter and instead, just specify a string with the property name, like:

```js
const data = [
  {"name": "Chris", "age": 23, "city": "New York"},
  {"name": "Emily", "age": 19, "city": "Atlanta"},
  {"name": "Joe", "age": 16, "city": "New York"}
]

const result = jsonquery(data, ["filter", ["eq", "city", "New York"]]) 
// result:    empty array
// expecteed: an array with two items
// solution:  specify "city" as a getter like ["filter", ["eq", ["get" "city"], "New York"]]
```

## Development

To develop, check out the repo, install dependencies once, and then use the following scripts:

```
npm run test
npm run test-ci
npm run lint
npm run format
npm run build
npm run build-and-test
```

Note that a new package is published on [npm](https://www.npmjs.com/package/@jsonquerylang/jsonquery) and [GitHub](https://github.com/jsonquerylang/jsonquery/releases) on changes pushed to the `main` branch. This is done using [`semantic-release`](https://github.com/semantic-release/semantic-release), and we do not use the `version` number in the `package.json` file. A changelog can be found by looking at the [releases on GitHub](https://github.com/jsonquerylang/jsonquery/releases).

## Motivation

There are many powerful query languages out there, so why the need to develop `jsonquery`? There are a couple of reasons for this.

1. **Syntax**

    Most JSON query languages have a syntax that is simple for very basic queries, but complex for more advanced queries. Their syntax is typically very compact but includes special characters and notations (like `@`, `$`, `|`, `?`, `:`, `*`, `&`), almost feeling like Regex which is infamously hard to read. The syntax is hard to remember unless you use the query language on a daily basis.

2. **Size**

    Most of the JSON query languages are quite big when looking at the bundle size. This can make them unsuitable for use in a web application where every kilobyte counts.

3. **Expressiveness**

    The expressiveness of most query languages is limited. Since a long time, my favorite JSON query language is JavaScript+Lodash because it is so flexible. The downside however is that it is not safe to store or share queries written in JavaScript: executing arbitrary JavaScript can be a security risk.

4. **Parsable**
    
    When a query language is simple to parse, it is easy to write integrations and adapters for it. For example, it is possible to write a visual user interface to write queries, and the query language can be implemented in various environments (frontend, backend).

The `jsonquery` language is inspired by [JavaScript+Lodash](https://jsoneditoronline.org/indepth/query/10-best-json-query-languages/#javascript), [JSON Patch](https://jsonpatch.com/), and [MongoDB aggregates](https://www.mongodb.com/docs/manual/aggregation/). It is basically a JSON notation to describe making a series of function calls. It has no magic syntax except for the need to be familiar with JSON, making it flexible and easy to understand. The library is extremely small thanks to smartly utilizing built-in JavaScript functions and the built-in JSON parser, requiring very little code to make the query language work.

## License

Released under the [ISC license](LICENSE.md).
