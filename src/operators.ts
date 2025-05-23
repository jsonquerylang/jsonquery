import { isArray } from './is'
import type { CustomOperator, OperatorGroup } from './types'

// operator precedence from highest to lowest
export const operators: OperatorGroup[] = [
  { pow: '^' },
  { multiply: '*', divide: '/', mod: '%' },
  { add: '+', subtract: '-' },
  { gt: '>', gte: '>=', lt: '<', lte: '<=', in: 'in', 'not in': 'not in' },
  { eq: '==', ne: '!=' },
  { and: 'and' },
  { or: 'or' },
  { pipe: '|' }
]

export const varargOperators = ['|', 'and', 'or']
export const leftAssociativeOperators = ['|', 'and', 'or', '*', '/', '%', '+', '-']

export function extendOperators(operators: OperatorGroup[], customOperators: CustomOperator[]) {
  // backward compatibility error with v4 where `operators` was an object
  if (!isArray(customOperators)) {
    throw new Error('Invalid custom operators')
  }

  return customOperators.reduce(extendOperator, operators)
}

function extendOperator(
  operators: OperatorGroup[],
  // @ts-expect-error Inside the function we will check whether at, below, and above are defined
  { name, op, at, after, before }: CustomOperator
): OperatorGroup[] {
  if (at) {
    return operators.map((group) => {
      return Object.values(group).includes(at) ? { ...group, [name]: op } : group
    })
  }

  const searchOp = after ?? before
  const index = operators.findIndex((group) => Object.values(group).includes(searchOp))
  if (index !== -1) {
    return operators.toSpliced(index + (after ? 1 : 0), 0, { [name]: op })
  }

  throw new Error('Invalid custom operator')
}
