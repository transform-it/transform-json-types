import test from 'ava'
import transform from '../src'

const x = `{
  "hello": [
    {
      "_id": "5988946e45e52d60b33a25c7",
      "latitude": 50.087977,
      "longitude": 72.167197,
      "tags": [
        "nulla",
        "ullamco"
      ],
      "friends": [
        {
          "id": 0,
          "name": "Robinson Woods"
        },
        {
          "id": 1,
          "name": "Lottie Hogan"
        }
      ]
    },
    {
      "_id": "5988946ef6090217857d7b0f",
      "latitude": 47.460772,
      "longitude": 85.95137,
      "tags": [
        "aliqua",
        "nulla"
      ],
      "friends": [
        {
          "id": 0,
          "name": "Mamie Wyatt"
        },
        {
          "id": 1,
          "name": "Alejandra Mcdaniel"
        }
      ]
    }
  ]
}
  `;

test('should return correct flow typings', t => {
	t.snapshot(transform(x))
})

test('should return correct flow typings if array is passed', t => {
	t.snapshot(transform(
		[{
			a: 'hello'
		}, {
			b: "hi"
		}]
	))
})

test('should return correct typescript interfaces', t => {
	t.snapshot(transform(x, {
		lang: 'typescript'
	}))
})

test('should return correct rust-serde struct', t => {
	t.snapshot(transform(x, {
		lang: "rust-serde"
	}))
})

test('should return correct Scala Case Class', t => {
	t.snapshot(transform(x, {
		lang: "scala"
	}))
})
