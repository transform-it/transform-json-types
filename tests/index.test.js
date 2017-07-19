import test from 'ava'
import sum from '../src'

test('Add', (t) => {
	t.is(sum(2,3), 5)
})
