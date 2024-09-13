# Function reference

This reference contains two types of functions:

- [_methods_](#methods) which are applied to a data input such as an array. For example: `map`, `filter`, `sort`.
- [_functions_](#functions) which only execute the arguments provided in the query. For example: `eq`, `lt`, `add`, `subtract`.

## Methods

### get

Get a path from an object.

```js
["get", ...props]
```

For example `["get", "age"]` gets the property `age` from an object, and `["get", "address", "city"]` gets a nested property `city` inside an object `address`. To get the current value or object itself, just specify `["get"]` without properties.

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
jsonquery(data, ["get", "address", "city"]) // "New York"
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

jsonquery(data, ["filter", ["gt", ["get", "age"], 30]])
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, ["filter", ["eq", ["get", "address", "city"], "New York"]])
// [
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, ["filter", [
  "and",
  ["gt", ["get", "age"], 30],
  ["eq", ["get", "city"], "New York"]
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
["sort", getter]
["sort", getter, direction]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, ["sort", ["get", "age"]])
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
// ]

jsonquery(data, ["sort", ["get", "age"], "desc"])
// [
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } }  
// ]

jsonquery(data, ["sort", ["get", "address", "city"]])
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } }
// ]

const values = [7, 2, 9]

jsonquery(values, ["sort"]) // [2, 7, 9]
jsonquery(values, ["sort", ["get"], "desc"]) // [9, 7, 2]
```

### pick

Pick one or multiple properties or paths, and create a new, flat object for each of them. Can be used on both an object or an array.

```js
["pick", ...getters]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, ["pick", ["get", "age"]])
// [
//   { "age": 23 },
//   { "age": 19 },
//   { "age": 27 }
// ]

jsonquery(data, ["pick", ["get", "name"], ["get", "address", "city"]])
// [
//   { "name": "Chris", "city": "New York" },
//   { "name": "Emily", "city": "Atlanta" },
//   { "name": "Michelle", "city": "Los Angeles" }
// ]

const item = { "price": 25 }

jsonquery(item, ["pick", ["get", "price"]]) // 25
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
  "firstName": ["get", "name"],
  "maxScore": [
    ["get", "scores"], 
    ["max"]
  ]
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
  ["map", ["multiply", ["get", "price"], ["get", "quantity"]]], 
  ["sum"]
])
// 8.6
```

### groupBy

Group a list with objects grouped by the value of given path. This creates an object with the different properties as key, and an array with all items having that property as value.

```js
["groupBy", getter]
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

jsonquery(data, ["groupBy", ["get", "city"]])
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
["keyBy", getter]
```

Examples:

```js
const data = [
  { id: 1, name: 'Joe' },
  { id: 2, name: 'Sarah' },
  { id: 3, name: 'Chris' }
]

jsonquery(data, ["keyBy", ["get", "id"]])
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
["uniqBy", getter]
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

jsonquery(data, ["uniqBy", ["get", "address", "city"]])
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

## Functions

### equal (`eq`)

Test whether two values are strictly equal. This will consider a string `"2"` and a number `2` to be _not_ equal for example since their data type differs.

```js
["eq", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 18 },
  { "name": "Kevin", "age": 18 }
]

jsonquery(data, ["filter", ["eq", ["get", "age"], 18]])
// [
//   { "name": "Emily", "age": 18 },
//   { "name": "Kevin", "age": 18 }
// ]

jsonquery({ a: 2 }, ["eq",  ["get"], "a", 2]) // true
jsonquery({ a: 2 }, ["eq",  ["get"], "a", 3]) // false
jsonquery({ a: 2 }, ["eq",  ["get"], "a", "2"]) // false (since not strictly equal)
```

### greater than (`gt`)

Test whether `a` is greater than `b`.

```js
["gt", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["gt", ["get", "age"], 18]])
// [
//   { "name": "Emily", "age": 32 }
// ]
```

### greater than or equal to (`gte`)

Test whether `a` is greater than or equal to `b`.

```js
["gte", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["gte", ["get", "age"], 18]])
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]
```

### less than (`lt`)

Test whether `a` is less than `b`.

```js
["lt", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["lt", ["get", "age"], 18]])
// [
//   { "name": "Chris", "age": 16 }
// ]
```

### less than or equal to (`lte`)

Test whether `a` is less than or equal to `b`.

```js
["lte", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["lte", ["get", "age"], 18]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not equal (`ne`)

Test whether two values are unequal. This is the opposite of the strict equal function `eq`. Two values are considered unequal when their data type differs (for example one is a string and another is a number), or when the value itself is different. For example a string `"2"` and a number `2` are considered unequal, even though their mathematical value is equal.

```js
["ne", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["ne", ["get", "age"], 16]])
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]

jsonquery({ a: 2 }, ["ne", ["get", "a"], 2]) // false
jsonquery({ a: 2 }, ["ne", ["get", "a"], 3]) // true
jsonquery({ a: 2 }, ["ne", ["get", "a"], "2"]) // true (since not strictly equal)
```

### and

Test whether both values are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```js
["and", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", [
  "and",
  ["eq", ["get", "name"], "Chris"],
  ["eq", ["get", "age"], 16]
]])
// [
//   { "name": "Chris", "age": 16 }
// ]
```

### or

Test whether one or both values are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```js
["or", a, b]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", [
  "or",
  ["eq", ["get", "age"], 16],
  ["eq", ["get", "age"], 18],
]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not

Function `not` inverts the value. When the value is truthy it returns `false`, and otherwise it returns `true`.

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

jsonquery(data, ["filter", ["not", ["eq", ["get", "age"], 18]]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Emily", "age": 32 }
// ]
```

### exists

Returns true if the value at the provided path exists, and returns false when it is `undefined`.

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

jsonquery(data, ["filter", ["exists", ["get", "details"]]])
// [
//   { "name": "Chris", "details": { "age": 16 } },
//   { "name": "Joe", "details": { "age": 18 } }
// ]

jsonquery({ "value": null }, ["exists", "value"]) // true
```

### in

Test whether the search value is one of the values of the provided list.

```js
["in", searchValue, ...values]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["in", ["get", "age"], [16, 18]]])
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

### not in

Test whether the search value is _not_ one of the values of the provided list.

```js
["not in", searchValue, ...values]
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, ["filter", ["not in", ["get", "age"], [16, 18]]])
// [
//   { "name": "Emily", "age": 32 }
// ]
```

### regex

Test the `text` against the regular expression.

```js
["regex", text, expression]
["regex", text, expression, options]
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

jsonquery(data, ["filter", ["regex", ["get", "message"], "like|awesome"]])
// [
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]

jsonquery(data, ["filter", ["regex", ["get", "message"], "like|awesome", "i"]])
// [
//   { "id": 1, "message": "I LIKE it!" },
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]
```

### add

Add two values.

```js
["add", a, b]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["add", ["get", "a"], ["get", "b"]]) // 8
```

### subtract

Subtract two values.

```js
["subtract", a, b]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["subtract", ["get", "a"], ["get", "b"]]) // 4
```

### multiply

Multiply two values.

```js
["multiply", a, b]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["multiply", ["get", "a"], ["get", "b"]]) // 12
```

### divide

Divide two values.

```js
["divide", a, b]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["divide", ["get", "a"], ["get", "b"]]) // 3
```

### power (`pow`)

Calculate the exponent. Returns the result of raising `a` to the power of `b`, like `a^b`

```js
["pow", a, b]
```

Examples:

```js
const data = { "a": 2, "b": 3 }

jsonquery(data, ["pow", ["get", "a"], ["get", "b"]]) // 8
```

### remainder (`mod`)

Calculate the remainder (the modulus) of `a` divided by `b`, like `a % b`.

```js
["mod", a, b]
```

Examples:

```js
const data = { "a": 8, "b": 3 }

jsonquery(data, ["mod", ["get", "a"], ["get", "b"]]) // 2
```

### abs

Calculate the absolute value.

```js
["abs", value]
```

Examples:

```js
jsonquery({"a": -7}, ["abs", ["get", "a"]]) // 7
```

### round

Round a value. When `digits` is provided, the value will be rounded to the selected number of digits.

```js
["round", value]
["round", value, digits]
```

Examples:

```js
jsonquery({"a": 23.7612 }, ["round", ["get", "a"]]) // 24
jsonquery({"a": 23.1345 }, ["round", ["get", "a"]]) // 23
jsonquery({"a": 23.1345 }, ["round", ["get", "a"], 2]) // 23.13
jsonquery({"a": 23.1345 }, ["round", ["get", "a"], 3]) // 23.135
```
