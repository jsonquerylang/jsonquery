# Operator reference

## equal (`==`)

Test whether two values are strictly equal. This will consider a string `"2"` and a number `2` to be _not_ equal for example since their data type differs.

```js
[left, "==", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## greater than (`>`)

Test whether the left side of the operator is larger than the right side.

```js
[left, ">", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## greater than or equal (`>=`)

Test whether the left side of the operator is larger than or equal to the right side.

```js
[left, ">=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## less than (`<`)

Test whether the left side of the operator is smaller than the right side.

```js
[left, "<", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## less than or equal (`<=`)

Test whether the left side of the operator is smaller than or equal to the right side.

```js
[left, "<=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## not equal (`!=`)

Test whether two values are unequal. This is the opposite of the strict equal operator `==`. Two values are considered unequal when their data type differs (for example one is a string and another is a number), or when the value itself is different. For example a string `"2"` and a number `2` are considered unequal, even though their mathematical value is equal.

```js
[left, "!=", right]
```

> Special case: when the right side is a string, it will be interpreted as a text and not a property. See section [Operators](../README.md#operators).

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

## and

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

## or

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

## not

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

## exists

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

## in

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

## not in

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

## regex

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

## add (`+`)

Add the left and right side of the operator.

```js
[left, "+", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "+", "b"]) // 8
```

## subtract (`-`)

Subtract the left and right side of the operator.

```js
[left, "-", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "-", "b"]) // 4
```

## multiply (`*`)

Multiply the left and right side of the operator.

```js
[left, "*", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "*", "b"]) // 12
```

## divide (`/`)

Divide the left and right side of the operator.

```js
[left, "/", right]
```

Examples:

```js
const data = { "a": 6, "b": 2 }

jsonquery(data, ["a", "/", "b"]) // 3
```

## power (`^`)

Calculate the exponent. Returns the result of raising the left value to the power of the right value.

```js
[left, "^", right]
```

Examples:

```js
const data = { "a": 2, "b": 3 }

jsonquery(data, ["a", "^", "b"]) // 8
```

## remainder (`%`)

Calculate the remainder (the modulus) of the left side divided by the right side.

```js
[left, "%", right]
```

Examples:

```js
const data = { "a": 8, "b": 3 }

jsonquery(data, ["a", "%", "b"]) // 2
```
