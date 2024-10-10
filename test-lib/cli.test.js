import cp from 'node:child_process'
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, test } from 'vitest'
import { help } from '../bin/help.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('command line interface', () => {
  const cli = join(__dirname, '..', 'bin', 'cli.js')
  const inputFile = join(__dirname, 'data', 'input.json')
  const inputQueryText = join(__dirname, 'data', 'query.txt')
  const inputQueryJson = join(__dirname, 'data', 'query.json')
  const outputFile = join(__dirname, 'output', 'output.json')

  beforeEach(() => {
    if (existsSync(outputFile)) {
      rmSync(outputFile)
    }
  })

  afterEach(() => {
    if (existsSync(outputFile)) {
      rmSync(outputFile)
    }
  })

  test('should output version', async () => {
    expect(await run(`node "${cli}" --version`)).toBe('0.0.0')
    expect(await run(`node "${cli}" -v`)).toBe('0.0.0')
  })

  test('should output help', async () => {
    expect(await run(`node "${cli}" --help`)).toBe(help)
    expect(await run(`node "${cli}" -h`)).toBe(help)
  })

  describe('input', () => {
    test('should process input from stdin', async () => {
      expect(await run(`echo [3,1,2] | node "${cli}" "sort()"`)).toBe('[\n  1,\n  2,\n  3\n]')
    })

    test('should process input from a file', async () => {
      expect(await run(`node "${cli}" --input "${inputFile}" "sort(.age)"`)).toBe(expectedOutput)
    })
  })

  describe('query', () => {
    test('should process an inline query', async () => {
      expect(await run(`node "${cli}" --input "${inputFile}" "sort(.age)"`)).toBe(expectedOutput)
    })

    test('should process a query file', async () => {
      expect(await run(`node "${cli}" --input "${inputFile}" --query "${inputQueryText}"`)).toBe(
        expectedOutput
      )
    })

    test('should process a query file with --format text', async () => {
      expect(
        await run(`node "${cli}" --input "${inputFile}" --query "${inputQueryText}" --format text`)
      ).toBe(expectedOutput)
    })

    test('should process a query file with --format json', async () => {
      expect(
        await run(`node "${cli}" --input "${inputFile}" --query "${inputQueryJson}" --format json`)
      ).toBe(expectedOutput)
    })

    test('should throw an error in case of an unknown format', async () => {
      try {
        await run(`node "${cli}" --input "${inputFile}" --query "${inputQueryJson}" --format FOO`)
        expect.fail('Should not succeed')
      } catch (err) {
        expect(err.message).toContain(
          'Error: Unknown format "FOO". Choose either "text" (default) or "json".'
        )
      }
    })

    test('should throw an error when query is undefined', async () => {
      try {
        await run(`node "${cli}" --input "${inputFile}"`)
        expect.fail('Should not succeed')
      } catch (err) {
        expect(err.message).toContain('Error: No query provided')
      }
    })
  })

  describe('output', () => {
    test('should output to stdout', async () => {
      expect(await run(`node "${cli}" --input "${inputFile}" "sort(.age)"`)).toBe(expectedOutput)
    })

    test('should should output to a file via stdout', async () => {
      const result = await run(
        `node "${cli}" --input "${inputFile}" "sort(.age)" > "${outputFile}"`
      )

      expect(result).toBe('')
      expect(String(readFileSync(outputFile))).toBe(expectedOutput)
    })

    test('should output to a file', async () => {
      const result = await run(
        `node "${cli}" --input "${inputFile}" "sort(.age)" --output "${outputFile}"`
      )

      expect(result).toBe('')
      expect(String(readFileSync(outputFile))).toBe(expectedOutput)
    })

    test('should not overwrite an existing file', async () => {
      const originalContent = '"original"'
      writeFileSync(outputFile, originalContent)

      try {
        await run(`node "${cli}" --input "${inputFile}" "sort(.age)" --output "${outputFile}"`)
        expect.fail('Should not succeed')
      } catch (err) {
        expect(err.message).toContain(`Cannot overwrite existing file "${outputFile}"`)
      }

      expect(String(readFileSync(outputFile))).toBe(originalContent)
    })

    test('should overwrite an existing file when --overwrite is provided', async () => {
      const originalContent = '"original"'
      writeFileSync(outputFile, originalContent)

      await run(
        `node "${cli}" --input "${inputFile}" "sort(.age)" --output "${outputFile}" --overwrite`
      )

      expect(String(readFileSync(outputFile))).toBe(expectedOutput)
    })
  })

  describe('indentation', () => {
    test('should output default indentation', async () => {
      expect(await run(`echo [3,1,2] | node "${cli}" "sort()"`)).toBe('[\n  1,\n  2,\n  3\n]')
    })

    test('should output custom indentation (4 spaces)', async () => {
      expect(await run(`echo [3,1,2] | node "${cli}" "sort()" --indentation "    "`)).toBe(
        '[\n    1,\n    2,\n    3\n]'
      )
    })

    test('should output custom indentation (tabs)', async () => {
      expect(await run(`echo [3,1,2] | node "${cli}" "sort()" --indentation "\t"`)).toBe(
        '[\n\t1,\n\t2,\n\t3\n]'
      )
    })

    test('should output custom indentation (compact)', async () => {
      expect(await run(`echo [3,1,2] | node "${cli}" "sort()" --indentation ""`)).toBe('[1,2,3]')
    })
  })
})

function run(command) {
  return new Promise((resolve, reject) => {
    cp.exec(command, (error, result) => {
      if (error) {
        reject(error)
      } else {
        resolve(result)
      }
    })
  })
}

const expectedOutput = `[
  {
    "name": "Emily",
    "age": 19
  },
  {
    "name": "Chris",
    "age": 23
  },
  {
    "name": "Joe",
    "age": 32
  }
]`
