transform-json-types
[![All Contributors](https://img.shields.io/badge/all_contributors-2-orange.svg?style=flat-square)](#contributors)
=========

An utility to generate Flow, TypeScript, Rust Serde Struct and Scala Case Class from JSON.

Installation
============

```
npm install transform-json-types
```

The online REPL is available at
- [JSON to Flow](https://transform.now.sh/json-to-flow-types)
- [JSON to TypeScript](https://transform.now.sh/json-to-ts-interface)
- [JSON to Scala Case Class](https://transform.now.sh/json-to-scala-case-class)
- [JSON to Rust Serde](https://transform.now.sh/json-to-rust-serde)

Basic Usage
===========
```js
import transform from "transform-json-types"

const json = `{
  "hello": "world"
}`

console.log(json, {
  lang: "typescript"
})

// interface RootJson {
//   hello: string
// }
```

API
===
### transform(json, [options])

#### json : `String | JSON`
(string | object) => JSON to be converted

### Options
Option|Default|Description
----|-----|-----
lang| 'flow'| One of `flow`, `typescript`, `scala` or `rust-serde`

License
=======
MIT @ [Ritesh Kumar](https://twitter.com/ritz078)





## Contributors

Thanks goes to these wonderful people ([emoji key](https://github.com/kentcdodds/all-contributors#emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
| [<img src="https://avatars3.githubusercontent.com/u/5389035?v=4" width="100px;"/><br /><sub>Ritesh Kumar</sub>](http://riteshkr.com)<br />[💻](https://github.com//transform-json-types/commits?author=ritz078 "Code") [📖](https://github.com//transform-json-types/commits?author=ritz078 "Documentation") [🤔](#ideas-ritz078 "Ideas, Planning, & Feedback") | [<img src="https://avatars2.githubusercontent.com/u/47542?v=4" width="100px;"/><br /><sub>Florian Gilcher</sub>](http://asquera.de)<br />[💻](https://github.com//transform-json-types/commits?author=skade "Code") |
| :---: | :---: |
<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/kentcdodds/all-contributors) specification. Contributions of any kind welcome!