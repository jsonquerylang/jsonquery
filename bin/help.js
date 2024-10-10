export const help = `
jsonquery
https://github.com/jsonquerylang/jsonquery

Query JSON documents. The command line application requires an input document
and query, and returns output containing the query result. The query can be
either in text format (default) or json format.

Usage:

    jsonquery [query] {OPTIONS}

Options:

    --input         Input file name
    --query         Query file name
    --output        Output file name
    --format        Can be "text" (default) or "json"
    --indentation   A string containing the desired indentation, 
                    like "  " (default) or "    " or "\\t". An empty
                    string will create output without indentation.
    --overwrite     If true, output can overwrite an existing file
    --version, -v   Show application version
    --help,    -h   Show this message

Example usage:

    jsonquery --input users.json 'sort(.age)'
    jsonquery --input users.json 'filter(.city == "Rotterdam") | sort(.age)'
    jsonquery --input users.json 'sort(.age)' > output.json
    jsonquery --input users.json 'sort(.age)' --output output.json
    jsonquery --input users.json --query query.txt
    jsonquery --input users.json --query query.json --format json
    cat users.json | jsonquery 'sort(.age)'
    cat users.json | jsonquery 'sort(.age)' > output.json

`
