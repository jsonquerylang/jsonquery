// TODO: move compileArgs to compile.ts?
import { FunctionCompiler, JSONQuery } from './types'
import { compile } from './compile'

export function compileArgs(fn: (...args: unknown[]) => unknown): FunctionCompiler {
  return (...args: JSONQuery[]) => {
    const compiledArgs = args.map((arg) => compile(arg))
    return (data: unknown) => fn(...compiledArgs.map((arg) => arg(data)))
  }
}
