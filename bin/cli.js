#!/usr/bin/env node
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { jsonquery } from '../lib/jsonquery.js'
import { help } from './help.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const options = {
  input: { type: 'string' },
  query: { type: 'string' },
  output: { type: 'string' },
  format: { type: 'string', default: 'text' },
  overwrite: { type: 'boolean', default: false },
  indentation: { type: 'string', default: '  ' },
  version: { type: 'boolean', short: 'v' },
  help: { type: 'boolean', short: 'h' }
}

const {
  values,
  positionals: [inlineQuery]
} = parseArgs({ options, allowPositionals: true })

await run({ ...values, inlineQuery })

/**
 * @param {Options} options
 * @returns {Promise<void>}
 */
async function run(options) {
  if (options.version) {
    return writeVersion()
  }

  if (options.help) {
    return writeHelp()
  }

  try {
    const input = await readInput(options)
    const query = readQuery(options)

    const output = jsonquery(input, query)

    return writeOutput(options, output)
  } catch (err) {
    process.stderr.write(err.toString())
    process.exit(1)
  }
}

/**
 * @param {Options} options
 * @returns {Promise<string>}
 */
async function readInput(options) {
  const inputStr = options.input ? fileToString(options.input) : await streamToString(process.stdin)

  if (inputStr.trim() === '') {
    throw Error('No input data provided')
  }

  return JSON.parse(inputStr)
}

/**
 * @param {Options} options
 * @returns {Promise<string>}
 */
function readQuery(options) {
  const queryStr = options.query
    ? fileToString(options.query)
    : options.inlineQuery
      ? options.inlineQuery
      : throwError('No query provided')

  return options.format === 'text' || options.format === undefined
    ? queryStr
    : options.format === 'json'
      ? JSON.parse(queryStr)
      : throwError(`Unknown format "${options.format}". Choose either "text" (default) or "json".`)
}

/**
 * @param {Options} options
 * @param {JSON} output
 */
function writeOutput(options, output) {
  const outputStr = JSON.stringify(output, null, options.indentation)

  if (options.output) {
    if (existsSync(options.output) && !options.overwrite) {
      throwError(`Cannot overwrite existing file "${options.output}"`)
    }

    writeFileSync(options.output, outputStr)
  } else {
    process.stdout.write(outputStr)
  }
}

function writeVersion() {
  const file = join(__dirname, '../package.json')
  const pkg = JSON.parse(String(readFileSync(file, 'utf-8')))

  process.stdout.write(pkg.version)
}

function writeHelp() {
  process.stdout.write(help)
}

function fileToString(fileName) {
  return String(readFileSync(fileName))
}

/**
 * @param {ReadableStream} readableStream
 * @returns {Promise<string>}
 */
function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    let text = ''

    readableStream.on('data', (chunk) => {
      text += String(chunk)
    })
    readableStream.on('end', () => {
      readableStream.destroy()
      resolve(text)
    })
    readableStream.on('error', (err) => reject(err))
  })
}

function throwError(message) {
  throw new Error(message)
}

/**
 * @typedef {Object} Options
 * @property {boolean} [version]
 * @property {boolean} [help]
 * @property {string} [input]
 * @property {string} [query]
 * @property {string} [output]
 * @property {string} [inlineQuery]
 * @property {'text' | 'json'} [format='text']
 * @property {string} [indentation='  ']
 * @property {boolean} [overwrite=false]
 */
