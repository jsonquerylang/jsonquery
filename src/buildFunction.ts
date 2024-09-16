import { FunctionBuilder, JSONQuery } from './types'
import { compile } from './compile'

export function buildFunction(fn: (...args: unknown[]) => unknown): FunctionBuilder {
  return (...args: JSONQuery[]) => {
    const compiledArgs = args.map((arg) => compile(arg))

    const arg0 = compiledArgs[0]
    const arg1 = compiledArgs[1]

    return compiledArgs.length === 1
      ? (data: unknown) => fn(arg0(data))
      : compiledArgs.length === 2
        ? (data: unknown) => fn(arg0(data), arg1(data))
        : (data: unknown) => fn(...compiledArgs.map((arg) => arg(data)))
  }
}
