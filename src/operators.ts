import type { CustomOperator, OperatorGroup } from './types'

// TODO: move the operators from constants.ts to this file

export function extendOperators(operators: OperatorGroup[], newOperators: CustomOperator[]) {
  return newOperators.reduce(extendOperator, operators)
}

function extendOperator(
  operators: OperatorGroup[],
  // @ts-expect-error Inside the function we will check whether at, below, and above are defined
  { name, op, at, below, above }: CustomOperator
): OperatorGroup[] {
  if (at) {
    return operators.map((group) => {
      return Object.values(group).includes(at) ? { ...group, [name]: op } : group
    })
  }

  const searchOp = below ?? above
  const index = operators.findIndex((group) => Object.values(group).includes(searchOp))
  if (index !== -1) {
    return operators.toSpliced(index + (below ? 1 : 0), 0, { [name]: op })
  }

  throw new Error('Failed to extend with new operator')
}
