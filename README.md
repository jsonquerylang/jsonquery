# JSON Query

![JSON Query Logo](https://jsonquerylang.org/frog-756900-100.png)

A small, flexible, and expandable JSON query language.

Try it out on the online playground: <https://jsonquerylang.org>

## Features

- Small (just `1.5 kB` when minified and gzipped!)
- Expressive
- Easy to understand and remember
- Serializable (it is JSON)
- Feature rich (36 powerful functions and operators)
- Expandable

## Install

```
npm install @josdejong/jsonquery
```

## Use

```js
import { jsonquery } from '@josdejong/jsonquery'

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
  ["friends"],
  ["filter", ["city", "==", "New York"]],
  ["sort", "age"],
  ["pick", "name", "age"]
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
  ["friends"],
  {
    "names": ["map", "name"],
    "count": ["size"],
    "averageAge": [
      ["map", "age"],
      ["average"]
    ]
  }
])
// result = {
//   "names": ["Chris", "Emily", "Joe", "Kevin", "Michelle", "Robert", "Sarah"],
//   "count": 7,
//   "averageAge": 28
// }

// use operators + - * / to do calculations
const shoppingCart = [
  { "name": "bread", "price": 2.5, "quantity": 2 },
  { "name": "milk", "price": 1.2, "quantity": 3 }
]
const totalPrice = jsonquery(shoppingCart, [
  ["map", ["price", "*", "quantity"]],
  ["sum"]
])
// totalPrice = 8.6
```

The build in functions can be extended with custom functions, like `times` in the following example:

```js
import { jsonquery } from '@josdejong/jsonquery'

const customFunctions = {
  times: (value) => (data) => data.map((item) => item * value)
}

const data = [1, 2, 3]
const result = jsonquery(data, ["times", 3], customFunctions)
// [3, 6, 9]
```

## JavaScript API

The `jsonquery` library has one core function where you pass the data, the query, and optionally an object with custom functions to extend the built-in functions:

```
jsonquery(data, query [, customFunctions])
```

Here:

- `data` is the JSON document that will be queried, often an array with objects.
- `query` is a JSON document containing a JSON query as described in the section below.
- `customFunctions` is an optional map with extra function creators. A function creator has optional arguments as input and must return a function that can be used to process the query data. For example:

    ```js
    const customFunctions = {
      // usage example: ["times", 3]
      times: (value) => (data) => data.map((item) => item * value)
    }
    ```

## Syntax

The `jsonquery` query language is written in JSON and has the following building blocks: _functions_, _operators_, _properties_, _pipes_, and _objects_.

The examples in the following sections are based on querying the following data:

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

### Functions

At the core of the query language, we have a _function_ call which described by an array with the function name as first item followed by optional function arguments. The following example will look up the `sort` function and then call it like `sort(data, 'age', 'asc')`. Here, `data` is the input and should be an array with objects which will be sorted in ascending by the property `age`:

```json
["sort", "age", "asc"]
```

Most of the functions use property names like `age` in the example above. Nested properties can be specified using an array. The following example will sort an array in descending order by a nested property `city` inside an object `address`:

```json
["sort", ["address", "city"], "desc"]
```

See section [Function reference](#function-reference) for a detailed overview of all available functions.

### Operators

An operator is an array with a left side value, the operator, and a right side value. In the following example, the operator describes that the property `age` of an object must be 18 or larger:

```json
["age", ">", 18]
```

or here an example where an operator checks whether a nested property `city` inside an object `address` has the value `"New York"`.

```json
[["address", "city"], "==", "New York"]
```

Operators are mostly used inside the `"filter"` function, for example:

```json
["filter", [["address", "city"], "==", "New York"]]
```

There are two special cases regarding operators:

1. All relational operators (`==`, `>`, `>=`, `<`, `<=`, `!=`) will interpret a string on the right side as a _text_ and not as a _property_ because this is a very common use case (like the "New York" example above). To specify a property on the right side of an operator, it must be enclosed in brackets. For example:

    ```js
    // WRONG: "age" is interpreted as text
    ["filter", [18, "<", "age"]]

    // RIGHT: "age" is interpreted as property
    ["filter", [18, "<", ["age"]]]
    ["filter", ["age", ">", 18]]
    ```

2. In order to specify a text on the left side of an operator instead of having it interpreted as a property, the `string` function can be used:

    ```js
    // WRONG: "New York" is interpreted as property
    ["filter", ["New York", "==", ["address", "city"]]]

    // RIGHT: "New York" is interpreted as text
    ["filter", [["string", "New York"], "==", ["address", "city"]]]
    ["filter", [["address", "city"], "==", "New York"]]
    ```

See section [Operator reference](#operator-reference) for a detailed overview of all available operators.

### Properties

In functions and operators, you can refer to object properties using an array containing one or multiple keys. In case of multiple keys, a nested property will be retrieved. For example:

```json
["address", "city"]
```

When the property contains only a single key, like `["age"]`, the brackets can be omitted and used like `"age"`:

```js
// equivalent:
["sort", "age"]
["sort", ["age"]] 
```

There is one special case regarding properties:

1. To get an object property that has the same name as a function, use the function `get`:

    ```js
    const data = { sort: 42 }

    jsonquery(data, ["get", "sort"]) // 42
    ```

### Pipes

A _pipe_ is an array containing a series of _functions_, _operators_, _properties_, _objects_, or _pipes_. The entries in the pipeline are executed one by one, and the output of the first is the input for the next. The following example will first filter the items of an array that have a property `city` with the value `"New York"`, and next, sort the filtered items by the property `age`:

```json
[
  ["filter", [["address", "city"], "==", "New York"]],
  ["sort", "age"]
]
```

### Objects

An _object_ is defined as a regular JSON object with a property name as key, and a _function_, _pipe_, or _object_ as value. Objects can be used to executed multiple query pipelines in parallel. The following example will output an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

```json
{
  "names": ["map", "name"],
  "count": ["size"],
  "averageAge": [
    ["map", "age"], 
    ["average"]
  ]
}
```

## Function reference

The following functions are available:

### get

Get a nested property from an object.

```js
["get", property]
```

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "address": { 
    "city": "New York" 
  } 
}

jsonquery(data, ["get", "name"]) // "Joe"
jsonquery(data, ["get", ["address", "city"]]) // "New York"
```

### filter

Filter a list with objects or values.

```js
["filter", condition]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Joe", "age": 32, "address": { "city": "New York" } },
  { "name": "Kevin", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
  { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
  { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
]

jsonquery(data, ["filter", ["age", ">", 30]])
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, ["filter", [["address", "city"], "==", "New York"]])
// [
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, ["filter", [
  ["age", ">", 30],
  "and",
  ["city", "==", "New York"]
]])
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]
```

### sort

Sort a list with objects or values.

```js
["sort"]
["sort", property]
["sort", property, direction]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, ["sort", "age"])
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
// ]

jsonquery(data, ["sort", "age", "desc"])
// [
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } }  
// ]

jsonquery(data, ["sort", ["address", "city"]])
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } }
// ]

const values = [7, 2, 9]

jsonquery(values, ["sort"]) // [2, 7, 9]
jsonquery(values, ["sort", [], "desc"]) // [9, 7, 2]
```

### pick

Pick one or multiple properties, which can be nested properties, and create a new, flat objects with them. Can be used on both an object or an array.

```js
["pick", ...properties]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, ["pick", "age"])
// [
//   { "age": 23 },
//   { "age": 19 },
//   { "age": 27 }
// ]

jsonquery(data, ["pick", "name", ["address", "city"]])
// [
//   { "name": "Chris", "city": "New York" },
//   { "name": "Emily", "city": "Atlanta" },
//   { "name": "Michelle", "city": "Los Angeles" }
// ]

const item = { "price": 25 }

jsonquery(item, ["pick", "price"]) // 25
```

### map

Map over an array and apply the callback to each of the items in the array.

```js
["map", callback]
```

Examples:

```js
const data = [
  { "name": "Chris", "scores": [5, 7, 3] },
  { "name": "Emily", "scores": [8, 5, 2, 5] },
  { "name": "Joe", "scores": [1, 1, 5, 6] }
]

jsonquery(data, ["map", { 
  "firstName": "name",
  "maxScore": ["scores", ["max"]]
}])
// [
//   {"firstName": "Chris", "maxScore": 7},
//   {"firstName": "Emily", "maxScore": 8},
//   {"firstName": "Joe"  , "maxScore": 6}
// ]

const cart = [
  {"name": "bread", "price": 2.5, "quantity": 2},
  {"name": "milk" , "price": 1.2, "quantity": 3}
]
jsonquery(data, [
  ['map', ['price', '*', 'quantity']], 
  ['sum']
])
// 8.6
```

### groupBy

Group a list with objects. This creates an object with the different properties as key, and an array with all items having that property as value.

```js
["groupBy", property]
```

Examples:

```js
const data = [
  { "name": "Chris", "city": "New York" },
  { "name": "Emily", "city": "Atlanta" },
  { "name": "Joe", "city": "New York" },
  { "name": "Kevin", "city": "Atlanta" },
  { "name": "Michelle", "city": "Los Angeles" },
  { "name": "Robert", "city": "Manhattan" },
  { "name": "Sarah", "city": "New York" }
]

jsonquery(data, ["groupBy", "city"])
// {
//   "New York": [
//     {"name": "Chris", "city": "New York"},
//     {"name": "Joe"  , "city": "New York"},
//     {"name": "Sarah", "city": "New York"}
//   ],
//   "Atlanta": [
//     {"name": "Emily", "city": "Atlanta"},
//     {"name": "Kevin", "city": "Atlanta"}
//   ],
//   "Los Angeles": [
//     {"name": "Michelle", "city": "Los Angeles"}
//   ],
//   "Manhattan": [
//     {"name": "Robert", "city": "Manhattan"}
//   ]
// }
```

### keyBy

Turn an array with objects into an object by key. When there are multiple items with the same key, the first item will be kept.

```js
["keyBy", property]
```

Examples:

```js
const data = [
  { id: 1, name: 'Joe' },
  { id: 2, name: 'Sarah' },
  { id: 3, name: 'Chris' }
]

jsonquery(data, ["keyBy", "id"])
// {
//   1: { id: 1, name: 'Joe' },
//   2: { id: 2, name: 'Sarah' },
//   3: { id: 3, name: 'Chris' }
// }
```

### keys

Return an array with the keys of an object.

```json
["keys"]
```

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "address": { 
    "city": "New York" 
  } 
}

jsonquery(data, ["keys"]) // ["name", "age", "address"]
```

### values

Return the values of an object.

```json
["values"]
```

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "city": "New York"
}

jsonquery(data, ["values"]) // ["Joe", 32, "New York"]
```

### flatten

Flatten an array containing arrays.

```json
["flatten"]
```

Examples:

```js
const data = [[1, 2], [3, 4]]

jsonquery(data, ["flatten"]) // [1, 2, 3, 4]

const data2 = [[1, 2, [3, 4]]]

jsonquery(data2, ["flatten"]) // [1, 2, [3, 4]]
```

### uniq

Create a copy of an array where all duplicates are removed.

```js
["uniq"]

jsonquery([1, 5, 3, 3, 1], ["uniq"]) // [1, 3, 5]
```

### uniqBy

Create a copy of an array where all objects with a duplicate value for the selected property are removed. In case of duplicates, the first object is kept.

```js
["uniqBy", property]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Joe", "age": 32, "address": { "city": "New York" } },
  { "name": "Kevin", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
  { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
  { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
]

jsonquery(data, ["uniqBy", ["address", "city"]])
// [
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } }
// ]
```

### limit

Create a copy of an array cut off at the selected limit.

```js
["limit", size]
```

Examples:

```js
const data = [1, 2, 3, 4, 5, 6]

jsonquery(data, ["limit", 2]) // [1, 2]
jsonquery(data, ["limit", 4]) // [1, 2, 3, 4]
```

### size

Return the size of an array.

```json
["size"]
```

Examples:

```js
jsonquery([1, 2], ["size"]) // 2
jsonquery([1, 2, 3, 4], ["size"]) // 4
```

### string

Process text as a string, preventing it to be processed as a property. See section [Operators](#operators) for more information.

```js
["string", text]
```

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "address": { 
    "city": "New York" 
  } 
}

jsonquery(data, ["string", "Hello World"]) // "Hello World"
jsonquery(data, [["string", "New York"], "==", ["address", "city"]]) // true
```

### sum

Calculate the sum of all values in an array.

```json
["sum"]
```

Examples:

```js
jsonquery([7, 4, 2], ["sum"]) // 13
jsonquery([2.4, 5.7], ["sum"]) // 8.1
```

### min

Return the minimum of the values in an array.

```json
["min"]
```

Examples:

```js
jsonquery([5, 1, 1, 6], ["min"]) // 1
jsonquery([5, 7, 3], ["min"]) // 3
```

### max

Return the maximum of the values in an array.

```json
["max"]
```

Examples:

```js
jsonquery([1, 1, 6, 5], ["max"]) // 6
jsonquery([5, 7, 3], ["max"]) // 7
```

### prod

Calculate the product of the values in an array.

```json
["prod"]
```

Examples:

```js
jsonquery([2, 3], ["prod"]) // 6
jsonquery([2, 3, 2, 7, 1, 1], ["prod"]) // 84
```

### average

Calculate the average of the values in an array.

```json
["average"]
```

Examples:

```js
jsonquery([2, 4], ["average"]) // 3
jsonquery([2, 3, 2, 7, 1], ["average"]) // 3
```

### round

Round a value. When `digits` is provided, the value will be rounded to the selected number of digits.

```js
["round"]
["round", digits]
```

Examples:

```js
jsonquery(23.1345, ["round"]) // 23
jsonquery(23.1345, ["round", 2]) // 23.13
jsonquery(23.1345, ["round", 3]) // 23.135
jsonquery(23.761, ["round"]) // 24
```

## Operator reference

- `==`
- `>`
- `>=`
- `<`
- `<=`
- `!=`
- `and`
- `or`
- `in`
- `not in`
- `regex`
- `+`
- `-`
- `*`
- `/`

## Motivation

There are many powerful query languages out there, so why the need to develop `jsonquery`? There are a couple of reasons for this.

1. **Syntax**

    Most JSON query languages have a syntax that is simple for very basic queries, but complex for more advanced queries. Their syntax is typically very compact but includes special characters and notations (like `@`, `$`, `|`, `?`, `:`, `*`, `&`), almost feeling like Regex which is infamously hard to read. The syntax is hard to remember unless you use the query language on a daily basis.

2. **Size**

    Most of the JSON query languages are quite big when looking at the bundle size. This can make them unsuitable for use in a web application where every kilobyte counts.

3. **Expressiveness**

    The expressiveness of most query languages is limited. Since a long time, my favorite JSON query language is JavaScript+Lodash because it is so flexible. The downside however is that it is not safe to store or share queries written in JavaScript: executing arbitrary JavaScript can be a security risk.

The `jsonquery` language is inspired by [JavaScript+Lodash](https://jsoneditoronline.org/indepth/query/10-best-json-query-languages/#javascript), [JSON Patch](https://jsonpatch.com/), and [MongoDB aggregates](https://www.mongodb.com/docs/manual/aggregation/). It is basically a JSON notation to describe making a series of function calls. It has no magic syntax except for the need to be familiar with JSON, making it flexible and easy to understand. The library is extremely small thanks to smartly utilizing built-in JavaScript functions and the built-in JSON parser, requiring very little code to make the query language work.

## License

Released under the [ISC license](LICENSE.md).
