# Function reference

The following functions are available:

## get

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

## filter

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

## sort

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

## pick

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

## map

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

## groupBy

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

## keyBy

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

## keys

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

## values

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

## flatten

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

## uniq

Create a copy of an array where all duplicates are removed.

```js
["uniq"]

jsonquery([1, 5, 3, 3, 1], ["uniq"]) // [1, 3, 5]
```

## uniqBy

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

## limit

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

## size

Return the size of an array.

```json
["size"]
```

Examples:

```js
jsonquery([1, 2], ["size"]) // 2
jsonquery([1, 2, 3, 4], ["size"]) // 4
```

## string

Process text as a string, preventing it to be processed as a property. See section [Operators](../README.md#operators) for more information.

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

## sum

Calculate the sum of all values in an array.

```json
["sum"]
```

Examples:

```js
jsonquery([7, 4, 2], ["sum"]) // 13
jsonquery([2.4, 5.7], ["sum"]) // 8.1
```

## min

Return the minimum of the values in an array.

```json
["min"]
```

Examples:

```js
jsonquery([5, 1, 1, 6], ["min"]) // 1
jsonquery([5, 7, 3], ["min"]) // 3
```

## max

Return the maximum of the values in an array.

```json
["max"]
```

Examples:

```js
jsonquery([1, 1, 6, 5], ["max"]) // 6
jsonquery([5, 7, 3], ["max"]) // 7
```

## prod

Calculate the product of the values in an array.

```json
["prod"]
```

Examples:

```js
jsonquery([2, 3], ["prod"]) // 6
jsonquery([2, 3, 2, 7, 1, 1], ["prod"]) // 84
```

## average

Calculate the average of the values in an array.

```json
["average"]
```

Examples:

```js
jsonquery([2, 4], ["average"]) // 3
jsonquery([2, 3, 2, 7, 1], ["average"]) // 3
```

## abs

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

## round

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

