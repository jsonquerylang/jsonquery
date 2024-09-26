# Functions

This reference lists all functions and operators.

## pipe (`|`)

The pipe operator executes a series of query operations one by one, and the output of the first is the input for the next.

```text
query1 | query2 | ...
pipe(query1, query2, ...)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, 'sort(.age) | pick(.name, .age)')
// [
//   { "name": "Emily", "age": 19 },
//   { "name": "Chris", "age": 23 },
//   { "name": "Michelle", "age": 27 }
// ]
```

## object

Create an object.

```text
{ prop1: query1, prop2: query2, ...}
object({ prop1: query1, prop2: query2, ...})
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, '{ names: map(.name), total: size() }')
// {
//   "names": ["Chris", "Emily", "Michelle"],
//   "total" 3
// }


jsonquery(data, 'map({ firstName: .name, city: .address.city})')
// [
//   { "firstName": "Chris", "city": "New York" },
//   { "firstName": "Emily", "city": "Atlanta" },
//   { "firstName": "Michelle", "city": "Los Angeles" }
// ]
```

## array

Create an array

```text
[query1, query2, ...]
array(query2, query2, ...)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age in [16, 18])')
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]

const locations = [
  {"latitude": 52.33, "longitude": 4.01},
  {"latitude": 52.18, "longitude": 3.99},
  {"latitude": 51.97, "longitude": 4.05}
]

jsonquery(locations, 'map([.latitude, .longitude])')
// [
//   [52.33, 4.01],
//   [52.18, 3.99],
//   [51.97, 4.05]
// ]
```

## get

Get a path from an object.

```text
.prop1
.prop1.prop2
."prop1"
get(prop1, prop2, ...)
```

For example `.age` gets the property `age` from an object, and `.address.city` gets a nested property `city` inside an object `address`. To get the current value or object itself use function `get()` without properties.

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "address": { 
    "city": "New York" 
  } 
}

jsonquery(data, '.name') // "Joe"
jsonquery(data, '.address.city') // "New York"
```

## filter

Filter a list with objects or values.

```text
filter(condition)
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

jsonquery(data, 'filter(.age > 30)')
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, 'filter(.address.city == "new York")')
// [
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]

jsonquery(data, 'filter((.age > 30) and (.address.city == "New York"))')
// [
//   { "name": "Joe", "age": 32, "address": { "city": "New York" } },
//   { "name": "Sarah", "age": 31, "address": { "city": "New York" } }
// ]
```

## sort

Sort a list with objects or values.

```text
sort()
sort(property)
sort(property, direction)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, 'sort(.age)')
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
// ]

jsonquery(data, 'sort(.age, "desc")')
// [
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } }  
// ]

jsonquery(data, 'sort(.address.city)')
// [
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } }
// ]

const values = [7, 2, 9]

jsonquery(values, 'sort()') // [2, 7, 9]
jsonquery(values, 'sort(get(), "desc")') // [9, 7, 2]
```

## pick

Pick one or multiple properties or paths, and create a new, flat object for each of them. Can be used on both an object or an array.

```text
pick(property1, property2, ...)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23, "address": { "city": "New York" } },
  { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
  { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } }
]

jsonquery(data, 'pick(.age)')
// [
//   { "age": 23 },
//   { "age": 19 },
//   { "age": 27 }
// ]

jsonquery(data, 'pick(.name, .address.city)')
// [
//   { "name": "Chris", "city": "New York" },
//   { "name": "Emily", "city": "Atlanta" },
//   { "name": "Michelle", "city": "Los Angeles" }
// ]

const item = { "price": 25 }

jsonquery(item, 'pick(.price)') // 25
```

## map

Map over an array and apply the provided query to each of the items in the array.

```text
map(query)
```

Examples:

```js
const data = [
  { "name": "Chris", "scores": [5, 7, 3] },
  { "name": "Emily", "scores": [8, 5, 2, 5] },
  { "name": "Joe", "scores": [1, 1, 5, 6] }
]

jsonquery(data, `map({
  firstName: .name,
  maxScore: .scores | max()
})`)
// [
//   {"firstName": "Chris", "maxScore": 7},
//   {"firstName": "Emily", "maxScore": 8},
//   {"firstName": "Joe"  , "maxScore": 6}
// ]

const cart = [
  {"name": "bread", "price": 2.5, "quantity": 2},
  {"name": "milk" , "price": 1.2, "quantity": 3}
]
jsonquery(data, 'map(.price * .quantity)')
// 8.6
```

## groupBy

Group a list with objects grouped by the value of given path. This creates an object with the different properties as key, and an array with all items having that property as value.

```text
groupBy(property)
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

jsonquery(data, 'groupBy(.city)')
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

```text
keyBy(property)
```

Examples:

```js
const data = [
  { id: 1, name: 'Joe' },
  { id: 2, name: 'Sarah' },
  { id: 3, name: 'Chris' }
]

jsonquery(data, 'keyBy(.id)')
// {
//   1: { id: 1, name: 'Joe' },
//   2: { id: 2, name: 'Sarah' },
//   3: { id: 3, name: 'Chris' }
// }
```

## keys

Return an array with the keys of an object.

```text
keys()
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

jsonquery(data, 'keys()') // ["name", "age", "address"]
```

## values

Return the values of an object.

```text
values()
```

Examples:

```js
const data = { 
  "name": "Joe", 
  "age": 32, 
  "city": "New York"
}

jsonquery(data, 'values()') // ["Joe", 32, "New York"]
```

## flatten

Flatten an array containing arrays.

```text
flatten()
```

Examples:

```js
const data = [[1, 2], [3, 4]]

jsonquery(data, 'flatten()') // [1, 2, 3, 4]

const data2 = [[1, 2, [3, 4]]]

jsonquery(data2, 'flatten()') // [1, 2, [3, 4]]
```

## uniq

Create a copy of an array where all duplicates are removed.

```text
uniq()
```

Example:

```js
jsonquery([1, 5, 3, 3, 1], 'uniq()') // [1, 3, 5]
```

## uniqBy

Create a copy of an array where all objects with a duplicate value for the selected path are removed. In case of duplicates, the first object is kept.

```text
uniqBy(property)
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

jsonquery(data, 'uniqBy(.address.city)')
// [
//   { "name": "Chris", "age": 23, "address": { "city": "New York" } },
//   { "name": "Emily", "age": 19, "address": { "city": "Atlanta" } },
//   { "name": "Michelle", "age": 27, "address": { "city": "Los Angeles" } },
//   { "name": "Robert", "age": 45, "address": { "city": "Manhattan" } }
// ]
```

## limit

Create a copy of an array cut off at the selected limit.

```text
limit(size)
```

Examples:

```js
const data = [1, 2, 3, 4, 5, 6]

jsonquery(data, 'limit(2)') // [1, 2]
jsonquery(data, 'limit(4)') // [1, 2, 3, 4]
```

## size

Return the size of an array.

```text
size()
```

Examples:

```js
jsonquery([1, 2], 'size()') // 2
jsonquery([1, 2, 3, 4], 'size()') // 4
```

## sum

Calculate the sum of all values in an array.

```text
sum()
```

Examples:

```js
jsonquery([7, 4, 2], 'sum()') // 13
jsonquery([2.4, 5.7], 'sum()') // 8.1
```

## min

Return the minimum of the values in an array.

```text
min()
```

Examples:

```js
jsonquery([5, 1, 1, 6], 'min()') // 1
jsonquery([5, 7, 3], 'min()') // 3
```

## max

Return the maximum of the values in an array.

```text
max()
```

Examples:

```js
jsonquery([1, 1, 6, 5], 'max()') // 6
jsonquery([5, 7, 3], 'max()') // 7
```

## prod

Calculate the product of the values in an array.

```text
prod()
```

Examples:

```js
jsonquery([2, 3], 'prod()') // 6
jsonquery([2, 3, 2, 7, 1, 1], 'prod()') // 84
```

## average

Calculate the average of the values in an array.

```text
average()
```

Examples:

```js
jsonquery([2, 4], 'average()') // 3
jsonquery([2, 3, 2, 7, 1], 'average()') // 3
```

## eq (`==`)

Test whether two values are strictly equal. This will consider a string `"2"` and a number `2` to be _not_ equal for example since their data type differs.

```text
a == b
eq(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 23 },
  { "name": "Emily", "age": 18 },
  { "name": "Kevin", "age": 18 }
]

jsonquery(data, 'filter(.age == 18)')
// [
//   { "name": "Emily", "age": 18 },
//   { "name": "Kevin", "age": 18 }
// ]

jsonquery({ a: 2 }, '.a == 2') // true
jsonquery({ a: 2 }, '.a == 3') // false
jsonquery({ a: 2 }, '.a == "2"') // false (since not strictly equal)
jsonquery({ a: 2 }, 'eq(.a, 2)') // true
```

## gt (`>`)

Test whether `a` is greater than `b`.

```text
a > b
gt(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age > 18)')
// [
//   { "name": "Emily", "age": 32 }
// ]
```

## gte (`>=`)

Test whether `a` is greater than or equal to `b`.

```text
a >= b
gte(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age >= 18)')
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]
```

## lt (`<`)

Test whether `a` is less than `b`.

```text
a < b
lt(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age < 18)')
// [
//   { "name": "Chris", "age": 16 }
// ]
```

## lte (`<=`)

Test whether `a` is less than or equal to `b`.

```text
a <= b
lte(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age <= 18)')
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

## ne (`!=`)

Test whether two values are not equal. This is the opposite of the strict equal function `eq`. Two values are considered unequal when their data type differs (for example one is a string and another is a number), or when the value itself is different. For example a string `"2"` and a number `2` are considered unequal, even though their mathematical value is equal.

```text
a != b
ne(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age != 16)')
// [
//   { "name": "Emily", "age": 32 },
//   { "name": "Joe", "age": 18 }
// ]

jsonquery({ a: 2 }, 'a != 2') // false
jsonquery({ a: 2 }, 'a != 3') // true
jsonquery({ a: 2 }, 'a != "2"') // true (since not strictly equal)
```

## and

Test whether both values are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```text
a and b
and(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Chris", "age": 18 }
]

jsonquery(data, 'filter((.name == "Chris") and (.age == 16))')
// [
//   { "name": "Chris", "age": 16 }
// ]
```

## or

Test whether one or both values are truthy. A non-truthy value is any of `false`, `0`, `""`, `null`, or `undefined`.

```text
a or b
or(a, b)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter((.age == 16) or (.age == 18))')
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

## not

Function `not` inverts the value. When the value is truthy it returns `false`, and otherwise it returns `true`.

```text
not(value)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(not(.age == 18))')
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Emily", "age": 32 }
// ]
```

## exists

Returns true if the value at the provided path exists, and returns false when it is `undefined`.

```text
exists(path)
```

Examples:

```js
const data = [
  { "name": "Chris", "details": { "age": 16 } },
  { "name": "Emily" },
  { "name": "Joe", "details": { "age": 18 } }
]

jsonquery(data, 'filter(exists(.details))')
// [
//   { "name": "Chris", "details": { "age": 16 } },
//   { "name": "Joe", "details": { "age": 18 } }
// ]

jsonquery({ "value": null }, ["exists", "value"]) // true
```

## in

Test whether the search value is one of the values of the provided list.

```text
searchValue in values
in(searchValue, values)
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age in [16, 18])')
// [
//   { "name": "Chris", "age": 16 },
//   { "name": "Joe", "age": 18 }
// ]
```

## not in

Test whether the search value is _not_ one of the values of the provided list.

```text
searchValue not in values
```

Examples:

```js
const data = [
  { "name": "Chris", "age": 16 },
  { "name": "Emily", "age": 32 },
  { "name": "Joe", "age": 18 }
]

jsonquery(data, 'filter(.age not in [16, 18])')
// [
//   { "name": "Emily", "age": 32 }
// ]
```

## regex

Test the `text` against the regular expression.

```text
regex(text, expression)
regex(text, expression, options)
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

jsonquery(data, 'filter(regex(.message, "like|awesome"))')
// [
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]

jsonquery(data, 'filter(regex(.message, "like|awesome", "i"))')
// [
//   { "id": 1, "message": "I LIKE it!" },
//   { "id": 2, "message": "It is awesome!" },
//   { "id": 4, "message": "We like it a lot" }
// ]
```

## add (`+`)

Add two values.

```text
a + b
add(a, b)
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, '.a + .b') // 8
```

## subtract (`-`)

Subtract two values.

```text
a - b
subtract(a, b)
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, '.a - .b') // 4
```

## multiply (`*`)

Multiply two values.

```text
a * b
multiply(a, b)
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, '.a * .b') // 12
```

## divide (`/`)

Divide two values.

```text
a / b
divide(a, b)
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, '.a / .b') // 3
```

## pow (`^`)

Calculate the exponent. Returns the result of raising `a` to the power of `b`, like `a^b`

```text
a ^ b
pow(a, b)
```

Examples:

```js
const data = { "a": 2, "b": 3 }

jsonquery(data, '.a ^ .b') // 8
```

## mod (`%`)

Calculate the remainder (the modulus) of `a` divided by `b`, like `a % b`.

```text
a % b
mod(a, b)
```

Examples:

```js
const data = { "a": 8, "b": 3 }

jsonquery(data, '.a % .b') // 2
```

## abs

Calculate the absolute value.

```text
abs(value)
```

Examples:

```js
jsonquery({"a": -7}, 'abs(.a)') // 7
```

## round

Round a value. When `digits` is provided, the value will be rounded to the selected number of digits.

```text
round(value)
round(value, digits)
```

Examples:

```js
jsonquery({"a": 23.7612 }, 'round(.a)') // 24
jsonquery({"a": 23.1345 }, 'round(.a)') // 23
jsonquery({"a": 23.1345 }, 'round(.a, 2)') // 23.13
jsonquery({"a": 23.1345 }, 'round(.a, 3)') // 23.135
```
