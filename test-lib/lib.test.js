import cp from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, test } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

describe('lib', () => {
  test('should load the library using ESM', async () => {
    const filename = join(__dirname, 'apps/esmApp.mjs')
    const result = await run(`node ${filename}`)
    expect(result).toBe('["Chris","Joe","Sarah"]\n')
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
