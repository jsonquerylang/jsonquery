# JSON Query

![JSON Query Logo](https://jsonquerylang.org/frog-756900-100.png)

A small, flexible, and expandable JSON query language.

Try it out on the online playground: <https://jsonquerylang.org>

![JSON Query Overview](https://jsonquerylang.org/jsonquery-overview.svg)

## Features

- Small: just `3.3 kB` when minified and gzipped! The JSON query engine without parse/stringify is only `1.7 kB`.
- Feature rich (50+ powerful functions and operators)
- Easy to interoperate with thanks to the intermediate JSON format.
- Expressive
- Expandable

## Documentation

On this page:

- [Installation](#installation)
- [Usage](#usage)
- [Syntax](#syntax)
- [JSON Format](#json-format)
- [JavaScript API](#javascript-api)
- [Command line interface (CLI)](#command-line-interface-cli)
- [Gotchas](#gotchas)
- [Development](#development)
- [Motivation](#motivation)
- [License](#license)

External pages:

- [Function reference](reference/functions.md)
- [Test Suite](test-suite/README.md)

## Installation

Install the JavaScript library via [npm](https://www.npmjs.com/):

```text
npm install @jsonquerylang/jsonquery
```

A Python implementation can be found here: https://github.com/jsonquerylang/jsonquery-python

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

// Get the array containing the friends from the object, filter the friends that live in New York,
// sort them by age, and pick just the name and age out of the objects.
const output = jsonquery(data, `
  .friends 
    | filter(.city == "New York") 
    | sort(.age) 
    | pick(.name, .age)
`)
// output = [
//   { "name": "Chris", "age": 23 },
//   { "name": "Sarah", "age": 31 },
//   { "name": "Joe", "age": 32 }
// ]

// The same query can be written in JSON format instead of the text format.
// Note that the functions `parse` and `stringify` can be used
// to convert from text format to JSON format and vice versa.
jsonquery(data, [
  "pipe",
  ["get", "friends"],
  ["filter", ["eq", ["get", "city"], "New York"]],
  ["sort", ["get", "age"]],
  ["pick", ["get", "name"], ["get", "age"]]
])
```

The build in functions can be extended with custom functions, like `times` in the following example:

```js
import { jsonquery } from '@jsonquerylang/jsonquery'

const options = {
  functions: {
    times: (value) => (data) => data.map((item) => item * value)
  }
}

const data = [1, 2, 3]
const result = jsonquery(data, 'times(3)', options)
// [3, 6, 9]
```

## Syntax

The `jsonquery` language looks quite similar to JavaScript and other JSON query languages. This makes it easy to learn. When writing a query, you compose a ["pipe"](https://medium.com/@efeminella/the-pipe-operator-a-glimpse-into-the-future-of-functional-javascript-7ebb578887a4) or a ["chain"](https://en.wikipedia.org/wiki/Method_chaining) of operations to be applied to the data. It resembles chaining like in [Lodash](https://lodash.com/docs/4.17.15#chain) or just [in JavaScript](https://medium.com/backticks-tildes/understanding-method-chaining-in-javascript-647a9004bd4f) itself using methods like `map` and `filter`.

Queries are written in a plain text format which is compact and easy to read for humans. The text format is parsed into an intermediate JSON format which is easy to operate on programmatically. This JSON format is executed by the query engine.

The text format has functions, operators, property getters, pipes to execute multiple queries in series, and objects to execute multiple queries in parallel or transform the input. For example:

```text
filter(.age >= 18) | sort(.age)
```

The text format can be converted (back and forth) into a JSON format consisting purely of composed function calls. A function call is described by an array containing the function name followed by its arguments, like `[name, arg1, arg2, ...]`. Here is the JSON equivalent of the previous example:

```json
[
  "pipe",
  ["filter", ["gte", ["get", "age"], 18]],
  ["sort", ["get", "age"]]
]
```

The JSON format is mostly used under the hood. It allows for easy integrations like a GUI or executing the query in a different environment or language without having to implement a parser for the text format. Read more in the [JSON Format](#json-format) section.

### Syntax overview

The following table gives an overview of the JSON query text format:

| Type                    | Syntax                                       | Example                                          |
|-------------------------|----------------------------------------------|--------------------------------------------------|
| [Function](#functions)  | `name(argument1, argument2, ...)`            | `sort(.age, "asc")`                              |
| [Operator](#operators)  | `(left operator right)`                      | `filter(.age >= 18)`                             |
| [Pipe](#pipes)          | <code>query1 &#124; query2 &#124; ...</code> | <code>sort(.age) &#124; pick(.name, .age)</code> |
| [Object](#objects)      | `{ prop1: query1, prop2: query2, ... }`      | `{ names: map(.name), total: sum() }`            |
| [Array](#arrays)        | `[ item1, item2, ... ]`                      | `[ "New York", "Atlanta" ]`                      |
| [Property](#properties) | `.prop1`<br/>`.prop1.prop2`<br/>`."prop1"`   | `.age`<br/>`.address.city`<br/>`."first name"`   |
| [String](#values)       | `"string"`                                   | `"Hello world"`                                  |
| [Number](#values)       | A floating point number                      | `2.4`                                            |
| [Boolean](#values)      | `true` or `false`                            | `true`                                           |
| [null](#values)         | `null`                                       | `null`                                           |

The syntax is explained in details in the following sections. The examples are based on querying the following data:

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

Function calls have the same syntax as in most programming languages:

```text
name(argument1, argument2, ...)
```

The following example will `sort` the data in ascending order, sorted by the property `age`.

```text
sort(.age, "asc")
```

Important to understand is that the functions are executed as a method in a chain: the sorting is applied to the data input, and forwarded to the next method in the chain (if any). The following example first filters the data, and next sorts it:

```text
filter(.age >= 21) | sort(.age, "asc")
```

See section [Function reference](reference/functions.md) for a detailed overview of all available functions and operators.

### Operators

JSON Query supports all basic operators. Operators must be wrapped in parentheses `(...)`, must have both a left and right hand side, and do not have precedence since parentheses are required. The syntax is:

```text
(left operator right)
```

The following example tests whether a property `age` is greater than or equal to `18`:

```text
(.age >= 18)
```

Operators are for example used to specify filter conditions:

```text
filter(.age >= 18)
```

When composing multiple operators, it is necessary to use parentheses:

```text
filter((.age >= 18) and (.age <= 65))
```

See section [Function reference](reference/functions.md) for a detailed overview of all available functions and operators.

### Pipes

A _pipe_ is a series of multiple query operations separated by a pipe character `|`. The syntax is:

```text
query1 | query2 | ...
```

The entries in the pipeline are executed one by one, and the output of the first is the input for the next. The following example will first filter the items of an array that have a nested property `city` in the object `address` with the value `"New York"`, and next, sort the filtered items by the property `age`:

```text
filter(.address.city == "New York") | sort(.age)
```

### Objects

An _object_ is defined as a regular JSON object with a property name as key, and query as value. Objects can be used to transform data or to execute multiple queries in parallel.

```text
{ prop1: query1, prop2: query2, ... }
```

The following example will transform the data by mapping over the items of the array and creating a new object with properties `firstName` and `city` for every item:

```text
map({
  firstName: .name,
  city: .address.city
})
```

The following example runs multiple queries in parallel. It outputs an object with properties `names`, `count`, and `averageAge` containing the results of their query: a list with names, the total number of array items, and the average value of the properties `age` in all items:

```text
{
  names: map(.name),
  count: size(),
  averageAge: map(.age) | average()
}
```

A property can be unquoted when it only contains characters `a-z`, `A-Z`, `_` and `$`, and all but the first character can be a number `0-9`. When the property contains other characters, like spaces, it needs to be enclosed in double quotes and escaped like JSON keys:

```text
{
  "first name": map(.name)
}
```

### Arrays

Arrays are defined like JSON arrays: enclosed in square brackets, with items separated by a comma:

```text
[query1, query2, ...]
```

Arrays can for example be used for the operators `in` and `not in`:

```text
filter(.city in ["New York", "Atlanta"])
```

### Properties

An important feature is the property getter. It allows to get a property from an object:

```text
.age
```

A nested property can be retrieved by specifying multiple properties. The following path for example describes the value of a nested property `city` inside an object `address`:

```text
.address.city
```

A property can be unquoted when it only contains characters `a-z`, `A-Z`, `_` and `$`, and all but the first character can be a number `0-9`. When the property contains other characters, like spaces, it needs to be enclosed in double quotes and escaped like JSON keys:

```text
."first name"
```

To get the current value itself, use the function `get()` without arguments.

### Values

JSON Query supports the following primitive values, the same as in [JSON](https://www.json.org): `string`, `number`, `boolean`, `null`.

| Type    | Example                                                           |
|---------|-------------------------------------------------------------------|
| string  | `"Hello world"`<br/>`"Multi line text\nwith \"quoted\" contents"` |
| number  | `42`<br/>`2.74`<br/>`-1.2e3`<br/>                                 |
| boolean | `true`<br/>`false`                                                |
| null    | `null`                                                            |

## JSON format

The text format describe above can be converted into an intermediate JSON format consisting purely of composed function calls and vice versa. A function call is described by an array containing the function name followed by its arguments, like `[name, arg1, arg2, ...]`. The following table gives an overview of the text format and the equivalent JSON format.

| Type     | Text format                                  | JSON format                                                               |
|----------|----------------------------------------------|---------------------------------------------------------------------------|
| Function | `name(argument1, argument2, ...)`            | `["name", argument1, argument2, ...]`                                     |
| Operator | `(left operator right)`                      | `["operator", left, right]`                                               |
| Pipe     | <code>query1 &#124; query2 &#124; ...</code> | `["pipe", query1, query2, ...]`                                           |
| Object   | `{ prop1: query1, prop2: query2, ... }`      | `["object", { "prop1": query1, "prop2": query2, ... }]`                   |
| Array    | `[ item1, item2, ... ]`                      | `["array", item1, item2, ... ]`                                           |
| Property | `.prop1`<br/>`.prop1.prop2`<br/>`."prop1"`   | `["get", "prop1"]`<br/>`["get", "prop1", "prop2"]`<br/>`["get", "prop1"]` |
| String   | `"string"`                                   | `"string"`                                                                |
| Number   | A floating point number                      | A floating point number                                                   |
| Boolean  | `true` or `false`                            | `true` or `false`                                                         |
| null     | `null`                                       | `null`                                                                    |

## JavaScript API

The library exports the following functions:

- [`jsonquery`](#jsonquery) is the core function of the library, which parses, compiles, and evaluates a query in one go.
- [`compile`](#compile) to compile and evaluate a query.
- [`parse`](#parse) to parse a query in text format into JSON.
- [`stringify`](#stringify) to convert a query in JSON into the text format.
- [`buildFunction`](#buildfunction) a helper function to create a custom function.

### jsonquery

The function `jsonquery` allows to pass data and a query in one go and parse, compile and execute it:

```text
jsonquery(data: JSON, query: string | JSONQuery, options: JSONQueryOptions) : JSON
```

Here:

- `data` is the JSON document that will be queried, often an array with objects.
- `query` is a JSON document containing a JSON query, either the text format or the parsed JSON format.
- `options` is an optional object that can contain the following properties:
  - `functions` is an optional map with custom function creators. A function creator has optional arguments as input and must return a function that can be used to process the query data. For example:

      ```js
      const options = {
        functions: {
          // usage example: 'times(3)'
          times: (value) => (data) => data.map((item) => item * value)
        }
      }
      ```

      If the parameters are not a static value but can be a query themselves, the function `compile` can be used to compile them. For example, the actual implementation of the function `filter` is the following:

      ```js
      const options = {
        functions: {
          // usage example: 'filter(.age > 20)'
          filter: (predicate) => {
            const _predicate = compile(predicate)
            return (data) => data.filter(_predicate)
          }
        }
      }
      ```

      You can have a look at the source code of the functions in `/src/functions.ts` for more examples.
  - `operators` is an optional map with operators, for example `{ eq: '==' }`. The defined operators can be used in a text query. Only operators with both a left and right hand side are supported, like `a == b`. They can only be executed when there is a corresponding function. For example:

      ```js
      import { buildFunction } from 'jsonquery'
      
      const options = {
        operators: {
          notEqual: '<>'
        },
        functions: {
          notEqual: buildFunction((a, b) => a !== b)
        }
      }
      ```

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

The compile function compiles and executes a query in JSON format. Function `parse` can be used to parse a text query into JSON before passing it to `compile`.

```text
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

### parse

Function `parse` parses a query in text format into JSON. Function `stringify` can be used to do the opposite.

```text
parse(query: text, options: JSONQueryParseOptions) : JSONQuery
```

Example:

```js
import { parse } from '@jsonquerylang/jsonquery'

const text = 'filter(.age > 20)'
const json = parse(text)
// json = ["filter", ["gt", ["get", "age"], 20]]
```

### stringify

Function `stringify` turns a query in JSON format into the equivalent text format. Function `parse` can be used to parse the text into JSON again.

```text
stringify(query: JSONQuery, options: JSONQueryStringifyOptions) : string
```

Example:

```js
import { stringify } from '@jsonquerylang/jsonquery'

const json = ["filter", ["gt", ["get", "age"], 20]]
const text = stringify(json)
// text = 'filter(.age > 20)'
```

### buildFunction

The function `buildFunction` is a helper function to create a custom function. It can only be used for functions (mostly operators), not for methods that need access the previous data as input.

The query engine passes the raw arguments to all functions, and the functions have to compile the arguments themselves when they are dynamic. For example:

```ts
const options = {
  operators: {
    notEqual: '<>'
  },
  functions: {
    notEqual: (a: JSONQuery, b: JSONQuery) => {
      const aCompiled = compile(a)
      const bCompiled = compile(b)

      return (data: unknown) => {
        const aEvaluated = aCompiled(data)
        const bEvaluated = bCompiled(data)

        return aEvaluated !== bEvaluated
      }
    }
  }
}

const data = { x: 2, y: 3}
const result = jsonquery(data, '(.x + .y) <> 6', options) // true
```

To automatically compile and evaluate the arguments of the function, the helper function `buildFunction` can be used:

```ts
import { jsonquery, buildFunction } from '@jsonquerylang/jsonquery'

const options = {
  operators: {
    notEqual: '<>'
  },
  functions: {
    notEqual: buildFunction((a: number, b: number) => a !== b)
  }
}

const data = { x: 2, y: 3}
const result = jsonquery(data, '(.x + .y) <> 6', options) // true
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

## Command line interface (CLI)

When `jsonquery` is installed globally using npm, it can be used on the command line. To install `jsonquery` globally:

```bash
$ npm install -g @jsonquerylang/jsonquery
```

Usage:

```
$ jsonquery [query] {OPTIONS}
```

Options:

```
--input         Input file name
--query         Query file name
--output        Output file name
--format        Can be "text" (default) or "json"
--indentation   A string containing the desired indentation, 
                like "  " (default) or "    " or "\t". An empty
                string will create output without indentation.
--overwrite     If true, output can overwrite an existing file
--version, -v   Show application version
--help,    -h   Show this message
```

Example usage:

```
$ jsonquery --input users.json 'sort(.age)'
$ jsonquery --input users.json 'filter(.city == "Rotterdam") | sort(.age)'
$ jsonquery --input users.json 'sort(.age)' > output.json
$ jsonquery --input users.json 'sort(.age)' --output output.json
$ jsonquery --input users.json --query query.txt
$ jsonquery --input users.json --query query.json --format json
$ cat users.json | jsonquery 'sort(.age)'
$ cat users.json | jsonquery 'sort(.age)' > output.json
```

## Gotchas

The JSON Query language has some gotchas. What can be confusing at first is to understand how data is piped through the query. A traditional function call is for example `max(myValues)`, so you may expect to have to write this in JSON Query like `["max", "myValues"]`. However, JSON Query has a functional approach where we create a pipeline like: `data -> max -> result`. So, you will have to write a pipe which first gets this property and next calls the function max: `.myValues | max()`.

Another gotcha is that unlike some other query languages, you need to use the `map` function to pick some properties out of an array _for every item_ in the array. When you're just picking a few fields without renaming them, you can use the function `pick` too, which is more concise.

```
.friends | { firstName: .name, age: .age }        WRONG 
.friends | map({ firstName: .name, age: .age })   RIGHT 
.friends | pick(.name, .age)                      RIGHT 
```

## Development

### JavaScript 

To develop, check out the JavaScript repo, install dependencies once, and then use the following scripts:

```text
npm run test
npm run test-ci
npm run lint
npm run format
npm run coverage
npm run build
npm run build-and-test
```

Note that a new package is published on [npm](https://www.npmjs.com/package/@jsonquerylang/jsonquery) and [GitHub](https://github.com/jsonquerylang/jsonquery/releases) on changes pushed to the `main` branch. This is done using [`semantic-release`](https://github.com/semantic-release/semantic-release), and we do not use the `version` number in the `package.json` file. A changelog can be found by looking at the [releases on GitHub](https://github.com/jsonquerylang/jsonquery/releases).

### Implement in a new language

Support for JSON Query language can be implemented in new programming languages. Implementing the query engine is most straight forward: this boils down to implementing each of the functions (`sort`, `filter`, `groupBy`, etc.), and creating a compiler which can go through a JSON Query like `["sort", ["get", "name"], "desc"]` look up the function `sort`, and pass the arguments to it. Implementing a parser and stringifier is a bit more work, but the parser and stringifier of the JavaScript implementation can be used as a reference.

There is a JSON based Test Suite available that can be used to ensure that your implementation matches the behavior of the reference implementation, see: [Test Suite](test-suite/README.md). 

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
