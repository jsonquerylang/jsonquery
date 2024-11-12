# JSON Query Test Suite

This test suite contains the reference tests for the JSON Query language in a language agnostic JSON format. These tests can be used to implement JSON Query in a new programming language or environment.

The test-suite contains three sections:
-   [`compile.test.json`](./compile.test.json) tests verifying the behavior of the compiler, the query engine, i.e.:

    ```js
    import { compile } from '@jsonquerylang/jsonquery'
     
    const queryIt = compile(["sort"])
    const result = queryIt([3, 1, 5])
    // result should be [1, 3, 5]
    ```

-   [`parse.test.json`](./parse.test.json) tests verifying the parser that parses the text format into the JSON format, i.e.:

    ```js
    import { parse } from '@jsonquerylang/jsonquery'
     
    const query = parse('filter(.age > 65)')
    // query should be ["filter", ["gt", ["get", "age"], 65]]
    ```

-   [`stringify.test.json`](./stringify.test.json) tests converting the JSON format into the test format (including indentation), i.e.:

    ```js
    import { stringify } from '@jsonquerylang/jsonquery'
     
    const text = stringify(["sort", ["get", "age"], "desc"])
    // text should be 'sort(.age, "desc")'
    ```

The test suites are accompanied by a `.d.ts` file containing the TypeScript models of the test suites, and a `.schema.json` file containing a JSON schema file matching the test suites. These can be of help when implementing a model for the test suites in a new language.
