import { jsonquery } from '../../lib/jsonquery.js'

const data = [
  { name: 'Chris', age: 23, city: 'New York' },
  { name: 'Emily', age: 19, city: 'Atlanta' },
  { name: 'Joe', age: 32, city: 'New York' },
  { name: 'Kevin', age: 19, city: 'Atlanta' },
  { name: 'Michelle', age: 27, city: 'Los Angeles' },
  { name: 'Robert', age: 45, city: 'Manhattan' },
  { name: 'Sarah', age: 31, city: 'New York' }
]

const result = jsonquery(data, [
  'pipe',
  ['filter', ['eq', ['get', 'city'], 'New York']],
  ['map', ['get', 'name']]
])

console.log(JSON.stringify(result))
