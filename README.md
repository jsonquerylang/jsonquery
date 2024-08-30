# JSON Query

![JSON Query Logo](https://jsonquerylang.org/frog-756900-100.png)

A small, flexible, and expandable JSON query language.

Try it out on the online playground: <https://jsonquerylang.org>

## Features

- Small (just `1.6 kB` when minified and gzipped!)
- Expressive
- Easy to understand and remember
- Serializable (it is JSON)
- Feature rich (40+ powerful functions and operators)
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
  ["filter", "city", "==", "New York"],
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

      If the parameters are not a primitive value but can be a query themselves, the function `compile` can be used to compile them. For example, the actual implementation of the function `filter` is the following:

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

  - `operators` is an optional map with custom operator creators. An operator creator receives the left and right side queries as input, and must return a function that implements the operator. Example:

      ```js
      const options = {
        operators: {
          // a loosely equal operator
          // usage example: ["value", "~=", 2] 
          '~=': (left, right) => {
              const a = compile(left)
              const b = compile(right)
              return (data) => a(data) == b(data)
          }
        }
      }
      ```

      You can have a look at the source code of the functions in `/src/operators.ts` for more examples.

Here an example of using the function `jsonquery`:

```js
import { jsonquery } from '@josdejong/jsonquery'

const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 19 },
  { "name": "Joe", "age": 32 }
]

const result = jsonquery(data, ["filter", "age", ">", 20])
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
import { compile } from '@josdejong/jsonquery'

const queryIt = compile(["filter", "age", ">", 20])

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

## error handling

When executing a query throws an error, the library attaches a stack to the error message which can give insight in what went wrong. The stack can be found at the property `error.jsonquery` and has type `Array<{ data: unknown, query: JSONQuery }>`. 

```js
const data = [
  { "name": "Chris", "age": 23, "scores": [7.2, 5, 8.0] },
  { "name": "Emily", "age": 19 }, // scores is missing here!
  { "name": "Joe", "age": 32, "scores": [6.1, 8.1] }
]

try {
  jsonquery(data, [
    ["pick", "age", "scores"],
    ["map", ["scores", ["sum"]]]
  ])
} catch (err) {
  console.log(err.jsonquery)
  // error stack:
  // [
  //   {
  //     "data": [
  //       { "name": "Chris", "age": 23, "scores": [7.2, 5, 8.0] },
  //       { "name": "Emily", "age": 19 },
  //       { "name": "Joe", "age": 32, "scores": [6.1, 8.1] }
  //     ],
  //     "query": [
  //       ["pick", "age", "scores"],
  //       ["map", ["scores", ["sum"]]]
  //     ]
  //   },
  //   {
  //     "data": [
  //       { "age": 23, "scores": [7.2, 5, 8.0] },
  //       { "age": 19 },
  //       { "age": 32, "scores": [6.1, 8.1] }
  //     ],
  //     "query": ["map", ["scores", ["sum"]]]
  //   },
  //   {
  //     "data": {"age": 19},
  //     "query": ["scores", ["sum"]]
  //   },
  //   {
  //     "data" : undefined,
  //     "query": ["sum"]
  //   }
  // ]
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

Syntax overview:

| Category                          | Syntax                                    | Example                                        |
|-----------------------------------|-------------------------------------------|------------------------------------------------|
| [Function](#functions)            | `[name, argument1, argument2, ...]`       | `["sort", ["address", "city"], "asc"]`         |
| [Operator](#operators)            | `[left, operator, right]`                 | `[["address", "city"], "==", "New York"]`      |
| [Property](#properties-and-paths) | `"property"`                              | `"age"`                                        |
| [Path](#properties-and-paths)     | `[property1, property2, ...]`             | `["address", "city"]`                          |
| [Pipe](#pipes)                    | `[query1, query1, ...]`                   | `[["sort", "age"], ["pick", "name", "age"]]`   |
| [Object](#objects)                | `{"prop1": query1, "prop2": query2, ...}` | `{"names": ["map", "name"], "total": ["sum"]}` |

The following sections explain the syntax in more detail.

### Functions

At the core of the query language, we have a _function_ call which described by an array with the function name as first item followed by optional function arguments. The following example will look up the `sort` function and then call it like `sort(data, 'age', 'asc')`. Here, `data` is the input and should be an array with objects which will be sorted in ascending by the property `age`:

```json
["sort", "age", "asc"]
```

Nested properties can be specified using a _path_: an array with properties. The following example will sort an array in descending order by a nested property `city` inside an object `address`:

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

1. All relational operators (`==`, `>`, `>=`, `<`, `<=`, `!=`) will interpret a string on the right side as a _text_ and not as a _property_ because this is a very common use case (like the "New York" example above). To specify a property on the right side of an operator, it must be changed into a _path_ by enclosing it in brackets. For example:

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

### Properties and paths

A _property_ is a string pointing to a value inside an object. For example the following property refers to the value of property `age` in an object:

```json
"age"
```

A _path_ is an array with _properties_. The following path for example describes the value of a nested property `city` inside an object `address`:

```json
["address", "city"]
```

Note that a path containing a single property is equivalent to just the property itself:

```js
// path ["age"] is equivalent to property "age":
["sort", ["age"]]
["sort", "age"]
```

There is one special case regarding paths:

1. When having a path where the first property is a function name like `["sort"]`, it will be interpreted as a function and not as a path. To parse this as a path, use the function `get`:
f

    ```js
    const data = { sort: 42 }

    jsonquery(data, ["get", "sort"]) // 42
    ```

### Pipes

A _pipe_ is an array containing a series of _functions_, _operators_, _properties_, _objects_, or _pipes_. The entries in the pipeline are executed one by one, and the output of the first is the input for the next. The following example will first filter the items of an array that have a nested property `city` in the object `address` with the value `"New York"`, and next, sort the filtered items by the property `age`:

```json
[
  ["filter", [["address", "city"], "==", "New York"]],
  ["sort", "age"]
]
```

### Objects

An _object_ is defined as a regular JSON object with a property name as key, and a _function_, _pipe_, or _object_ as value. Objects can be used to transform data or to execute multiple query pipelines in parallel.

The following example will map over the items of the array and create a new object with properties `firstName` and `city` for every item:

```json
["map", {
  "firstName": "name",
  "city": ["address", "city"]
}]
```

The following example will output an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

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

Get a path from an object.

```js
["get", path]
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
["filter", left, operator, right]
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

jsonquery(data, ["filter", "age", ">", 30])
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, ["filter", ["address", "city"], "==", "New York"])
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
["sort", path]
["sort", path, direction]
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

Pick one or multiple properties or paths, and create a new, flat object for each of them. Can be used on both an object or an array.

```js
["pick", ...paths]
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

Map over an array and apply the provided query to each of the items in the array.

```js
["map", query]
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

Group a list with objects grouped by the value of given path. This creates an object with the different properties as key, and an array with all items having that property as value.

```js
["groupBy", path]
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
["keyBy", path]
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

Create a copy of an array where all objects with a duplicate value for the selected path are removed. In case of duplicates, the first object is kept.

```js
["uniqBy", path]
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

### abs

Calculate the absolute value.

```js
["abs"]
```

Examples:

```js
jsonquery(2, ["abs"]) // 2
jsonquery(-3, ["abs", 2]) // 3
jsonquery({"a": -7}, [["a"], ["abs"]]) // 7
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

### equal (`==`)

Test whether two values are strictly equal. This will consider a string `"2"` and a number `2` to be _not_ equal for example since their data type differs.

```js
[left, "==", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 18 },
  { "name": "Kevin", "age": 18 }
]

jsonquery(data, ["filter", ["age", "==", 18]])
// [
//   { "name": "Emily", "age": 18 },
//   { "name": "Kevin", "age": 18 }
// ]

jsonquery({ a: 2 }, ["a", "==", 2]) // true
jsonquery({ a: 2 }, ["a", "==", 3]) // false
jsonquery({ a: 2 }, ["a", "==", "2"]) // false (since not strictly equal)
```

### greater than (`>`)

Test whether the left side of the operator is larger than the right side.

```js
[left, ">", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", ">", 18]])
// [
//   { "name": "Emily", "age": 32 }
// ]
```

### greater than or equal (`>=`)

Test whether the left side of the operator is larger than or equal to the right side.

```js
[left, ">=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", ">=", 18]])
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]
```

### less than (`<`)

Test whether the left side of the operator is smaller than the right side.

```js
[left, "<", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", "<", 18]])
// [
//   { "name": "Chris", "age": 16 }
// ]
```

### less than or equal (`<=`)

Test whether the left side of the operator is smaller than or equal to the right side.

```js
[left, "<=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", "<=", 18]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not equal (`!=`)

Test whether two values are unequal. This is the opposite of the strict equal operator `==`. Two values are considered unequal when their data type differs (for example one is a string and another is a number), or when the value itself is different. For example a string `"2"` and a number `2` are considered unequal, even though their mathematical value is equal.

```js
[left, "!=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](#operators).

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", "!=", 16]])
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]

jsonquery({ a: 2 }, ["a", "!=", 2]) // false
jsonquery({ a: 2 }, ["a", "!=", 3]) // true
jsonquery({ a: 2 }, ["a", "!=", "2"]) // true (since not strictly equal)
```

### and

Test whether both left and right value are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```js
[left, "and", right]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", [
  ["name", "==", "Chris"],
  "and"
  ["age", "==", 16],
]])
// [
//   { "name": "Chris", "age": 16 }
// ]
```

### or

Test whether one or both operands are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```js
[left, "or", right]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", [
  ["age", "==", 16],
  "or"
  ["age", "==", 18],
]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not

Operator not inverts the right hand side. It has no left hand value. When the right hand is truthy it returns `false`, and otherwise it returns `true`.

```js
["not", value]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["not", ["age", "==", 18]]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Emily", "age": 32 }
// ]
```

### exists

Returns true if the right hand side exists, and returns false when the right hand side is undefined. Also returns true when the path contains a value `null`.

```js
["exists", path]
```

Examples:

```js
const data = [
  { "name": "Chris", "details": { "age": 16 } },
  { "name": "Emily" },
  { "name": "Joe", "details": { "age": 18 } }
]

jsonquery(data, ["filter", ["exists", "details"]])
// [
//   { "name": "Chris", "details": { "age": 16 } },
//   { "name": "Joe", "details": { "age": 18 } }
// ]

jsonquery({ "value": null }, ["exists", "value"]) // true
```

### in

Test whether the left operand is one of the values of the list provided as right operand.

```js
[left, "in", ...values]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", "in", [16, 18]]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not in

Test whether the left operand is _not_ one of the values of the list provided as right operand.

```js
[left, "not in", ...values]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["age", "not in", [16, 18]]])
// [
//   { "name": "Emily", "age": 32 }
// ]
```

### regex

Test the left operand against the regular expression on the right hand.

```js
[left, "regex", expression]
[left, "regex", expression, options]
```

Here, `expression` is a string containing the regular expression like `^[a-z]+$`, and `options` are regular expression flags like `i`.

Examples:

```js
const data = [
  { "id": 1, "message": "I LIKE it!" },
  { "id": 2, "message": "It is awesome!" },
  { "id": 3, "message": "Was a disaster" },
  { "id": 4, "message": "We like it a lot" }
]

jsonquery(data, ["filter", ["message", "regex", "like|awesome"]])
// [
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]

jsonquery(data, ["filter", ["message", "regex", "like|awesome", "i"]])
// [
//   { "id": 1, "message": "I LIKE it!" },
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]
```

### add (`+`)

Add the left and right side of the operator.

```js
[left, "+", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "+", "b"]) // 8
```

### subtract (`-`)

Subtract the left and right side of the operator.

```js
[left, "-", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "-", "b"]) // 4
```

### multiply (`*`)

Multiply the left and right side of the operator.

```js
[left, "*", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "*", "b"]) // 12
```

### divide (`/`)

Divide the left and right side of the operator.

```js
[left, "/", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "/", "b"]) // 3
```

### power (`^`)

Calculate the exponent. Returns the result of raising the left value to the power of the right value.

```js
[left, "^", right]
```

Examples:

```js
const data = { "a": 2, "b": 3 }

jsonquery(data, ["a", "^", "b"]) // 8
```

### remainder (`%`)

Calculate the remainder (the modulus) of the left side divided by the right side.

```js
[left, "%", right]
```

Examples:

```js
const data = { "a": 8, "b": 3 }

jsonquery(data, ["a", "%", "b"]) // 2
```

## Limitations

The JSON Query language has some limitations, pitfalls, and gotchas.

Though the language is easy to learn and understand, it is relatively verbose due to the need for quotes around all keys, and the need for a lot of arrays in square brackets `[...]`. This is a consequence of expressing a query using JSON whilst wanting to keep the language concise.

The use of arrays `[...]` is quite overloaded. An array can hold a function call, operator, pipe, or path with properties. Given a query being an array containing three strings `[string, string, string]` for example, it's meaning can only be determined by looking up whether the first string matches a known function, then looking up whether the second string matches a known operator, and lastly conclude that it is a path with properties. When making a mistake, the error message you get is mostly unhelpful, and the best way to debug is to build your query step by step, validating that it works after every step.

What can also be confusing at first is to understand how data is piped through the query. A traditional function call is for example `abs(myValue)`, so you may expect to have to write this in JSON Query like `["abs", "myValue"]`. However, JSON Query has a functional approach where we create a pipeline like: `data -> abs -> result`. So, to get the absolute value of a property `myValue`, you will have to write a pipe first getting this property and then calling abs: `[["get", "myValue"], ["abs"]]"`.

### Gotchas

Here some gotchas.

1. Having an problem halfway the query, resulting in a vague error. In the following example, the first part of the query results in `undefined`, and then we try to filter that, resulting in an error:

    ```js
    const data = {
      "friends": [
        {"name": "Chris", "age": 23, "city": "New York"},
        {"name": "Emily", "age": 19, "city": "Atlanta"},
        {"name": "Joe", "age": 16, "city": "New York"}
      ]
    }

    const result = jsonquery(data, [
      ["get", "friiends"],
      ["filter", ["city", "==", "New York"]]
    ])
    // result: "Error: e is undefined" 
    // expected: an array with two items
    ```

2. Making a typo in a function name, which then is interpreted as getting a property. This results in vague output or in an error. In the following example, the property `"filte"` is read from the data, resulting in `undefined`. After that, the property `"city"` is read from `undefined`, resulting in `undefined`, and lastly, we check whether `undefined` is equal to the string `"New York"`, which is not the case, so, the query returns `false`.

    ```js
    const data = [
      {"name": "Chris", "age": 23, "city": "New York"},
      {"name": "Emily", "age": 19, "city": "Atlanta"},
      {"name": "Joe", "age": 16, "city": "New York"}
    ]
    
    const result = jsonquery(data, ["filte", ["city", "==", "New York"]]) 
    // result: the boolean value false 
    // expected: an array with two items
    ```

3. Making a typo in a property name, resulting in unexpected results.

    ```js
    const data = [
      {"name": "Chris", "age": 23, "city": "New York"},
      {"name": "Emily", "age": 19, "city": "Atlanta"},
      {"name": "Joe", "age": 16, "city": "New York"}
    ]
    
    const result = jsonquery(data, ["filter", ["cities", "==", "New York"]]) 
    // result: an empty array 
    // expected: an array with two items
    ```

4. Forgetting brackets around a nested query. In the following example, the filter condition has no brackets. Therefore, the property `"city"` is used as condition and the arguments `"=="` and `"New York"` are ignored.

    ```js
    const data = [
      {"name": "Chris", "age": 23, "city": "New York"},
      {"name": "Emily", "age": 19, "city": "Atlanta"},
      {"name": "Joe", "age": 16, "city": "New York"}
    ]
    
    const result = jsonquery(data, ["filter", "age", ">", 18]) 
    // result: the original data
    // expected: an array with two items
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

Note that a new package is published on [npm](https://www.npmjs.com/package/@josdejong/jsonquery) and [GitHub](https://github.com/josdejong/jsonquery/releases) on changes pushed to the `main` branch. This is done using [`semantic-release`](https://github.com/semantic-release/semantic-release), and we do not use the `version` number in the `package.json` file. A changelog can be found by looking at the [releases on GitHub](https://github.com/josdejong/jsonquery/releases).

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
