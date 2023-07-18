---
title: Vite过程中CommonJs兼容问题
description: Vite 兼容性
aside: false
date: 2022-12-28
tags:
  - Vite
---

## 创建 CommonJs 包

文件目录结构：

```bash
.
├── libs
│   ├── bar
│   │   ├── bar.js
│   │   ├── index.js
│   │   └── package.json
│   └── foo
│       ├── index.js
│       └── package.json
├── node_modules
├── index.html
├── main.js
├── style.css
└── vite.config.js
```

通常，我们可以在 node_modules 下直接创建 foo 和 bar 包，为了方便维护，我们将自定义的 CommonJs 包放到 libs 目录，再进行 link。

其中 foo 模块只定义了 index.js:

```js
// foo/index.js
function foo(name) {
  console.log(`Hi ${name}!`);
}

Object.defineProperty(exports, "__esModule", { value: true });
exports.foo = foo;
exports.default = foo;
```

> 这里定义\_\_esModule 为 true 是为了假装从 ES Module 转换生成的 CommonJs，同时定义了 exports.default，纯的 CommonJs 包使用 exports（或者 module.exports）而不是 exports.default 作为默认导出。

bar 模块和 foo 模块几乎一致，但是多了一次额外的导入导出:

```js
// bar/bar.js
function bar(name) {
  console.log(`Hi ${name}!`);
}

Object.defineProperty(exports, "__esModule", { value: true });
exports.bar = bar;
exports.default = bar;

// bar/index.js
module.exports = require("./bar");
```

package.json 使用相对路径来安装 libs 的两个包

```json
{
  "name": "vite-demo",
  "version": "0.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "serve": "vite preview"
  },
  "dependencies": {
    "bar": "./libs/bar",
    "foo": "./libs/foo"
  },
  "devDependencies": {
    "vite": "^2.6.14"
  }
}
```

main.js 定义为 ES Module,引用 foo 模块和 bar 模块:

```js
// main.js
import fooDefault, { foo } from "foo";
import barDefault, { bar } from "bar";

foo("foo");
fooDefault("fooDefault");

bar("bar");
barDefault("barDefault");
```

## 安装构建

下面开始安装

```bash
pnpm install

bar is linked to D:\vite-demo\node_modules from D:\vite-demo\libs\bar
foo is linked to D:\vite-demo\node_modules from D:\vite-demo\libs\foo
Already up-to-date
Progress: resolved 22, reused 5, downloaded 0, added 0, done
```

pnpm 安装后会在 node_modules 目录创建链接。此时 vite dev 运行正常，vite build 报错。

```bash
pnpm build

> vite-demo@0.0.0 build D:\vite-demo
> vite build

vite v2.6.14 building for production...
✓ 5 modules transformed.
'foo' is not exported by libs\foo\index.js, imported by main.js
file: D:/vite-demo/main.js:1:20
1: import fooDefault, {foo} from 'foo'
                       ^
2: import barDefault, {bar} from 'bar'
error during build:
Error: 'foo' is not exported by libs\foo\index.js, imported by main.js
    at error (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:158:30)
    at Module.error (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:12382:16)
    at Module.traceVariable (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:12767:29)
    at ModuleScope.findVariable (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:11559:39)
    at Identifier.bind (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:6419:40)
    at CallExpression.bind (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:5025:23)
    at CallExpression.bind (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:9396:15)
    at ExpressionStatement.bind (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:5025:23)
    at Program.bind (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:5021:31)
    at Module.bindReferences (D:\vite-demo\node_modules\.pnpm\rollup@2.60.1\node_modules\rollup\dist\shared\rollup.js:12378:18)
 ELIFECYCLE  Command failed with exit code 1.
```

其实上面的异常来源于 Rollup，因为 vite 是对 Rollup 做了封装。运行 vite build 时，把 CommonJs 转换成 ES Module 的工作是由插件@rollup/plugin-commonjs 实现的，vite 通过 build.commonjsOptions 配置项自定义参数。

- [vite build.commonjsOptions]: https://cn.vitejs.dev/config/#build-commonjsoptions

- [@rollup/plugin-commonjs]: https://github.com/rollup/plugins/tree/master/packages/commonjs#usage-with-symlinks

在 @rollup/plugin-commonjs 的文档中可以搜到 symlink 相关的使用注意项：

> Usage with symlinks
> Symlinks are common in monorepos and are also created by the npm link command. Rollup with @rollup/plugin-node-resolve resolves modules to their real paths by default. So include and exclude paths should handle real paths rather than symlinked paths (e.g. ../common/node_modules/** instead of node_modules/**). You may also use a regular expression for include that works regardless of base path. Try this:

```js
commonjs({
  include: /node_modules/,
});
```

Whether symlinked module paths are realpathed or preserved depends on Rollup's preserveSymlinks setting, which is false by default, matching Node.js' default behavior. Setting preserveSymlinks to true in your Rollup config will cause import and export to match based on symlinked paths instead.

这里的 include 应该就是我们需要的。见 https://github.com/vitejs/vite/blob/d2887729911d52e3117a7649e85460b346f04b54/packages/vite/src/node/build.ts#L264-L268。

```js
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.cjs'],
      ...raw?.commonjsOptions
    }
```

vite 默认只对 node_modules 文件夹下的.js 和.cjs 做转换。如果我们把 libs 文件夹加进去，Rollup 就可以正确转换 foo 和 bar 模块了。

```js
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    commonjsOptions: {
      include: /node_modules|libs/,
    },
  },
});
```

## 运行

构建完成后，运行 pnpm serve，打开浏览器看控制台输出。

```bash
Hi foo!
Hi fooDefault!
Hi bar!
Uncaught TypeError: bar is not a function
```

对照 main.js 来看:

```js
// main.js
import fooDefault, { foo } from "foo";
import barDefault, { bar } from "bar";

foo("foo");
fooDefault("fooDefault");

bar("bar");
barDefault("barDefault");
```

只有通过默认导入的形式使用 bar 包会报错，如 import xxx from 'xxx'。

在解决 Uncaught TypeError: bar is not a function 错误之前，我们再翻翻 @rollup/plugin-commonjs 的文档。其中有一个 defaultIsModuleExports 配置项，可以控制从 ES Module 中导入 CommonJS 模块时的默认导出对象。

- 为 true 时，使用 module.exports 作为默认导出

```js
// mod.cjs
exports.default = 3;

import foo from "./mod.cjs";
console.log(foo); // { default: 3 }
```

- 为 false 时，使用 exports.default 作为默认导出

```js
// mod.cjs
exports.default = 3;

import foo from "./mod.cjs";
console.log(foo); // 3
```

- 为 "auto" 时，判断 CommonJS 模块是否有 exports.\_\_esModule 属性且为 true，若满足，使用 exports.default 作为默认导出，否则使用 module.exports

```js
// mod.cjs
exports.default = 3;

// mod-compiled.cjs
exports.__esModule = true;
exports.default = 3;

import foo from "./mod.cjs";
import bar from "./mod-compiled.cjs";
console.log(foo); // { default: 3 }
console.log(bar); // 3
```

defaultIsModuleExports 的默认值为 "auto"，不得不说是最佳设置，原来 Rollup 是通过 exports.\_\_esModule === true 来控制模块默认导出

Rollup 相关代码如下：

```js
// https://github.com/rollup/plugins/blob/02fb349d315f0ffc55970fba5de20e23f8ead881/packages/commonjs/src/transform-commonjs.js#L152-L162
if (defaultIsModuleExports === false) {
  shouldWrap = true;
} else if (defaultIsModuleExports === "auto") {
  if (node.right.type === "ObjectExpression") {
    if (hasDefineEsmProperty(node.right)) {
      shouldWrap = true;
    }
  } else if (defaultIsModuleExports === false) {
    shouldWrap = true;
  }
}

// https://github.com/rollup/plugins/blob/02fb349d315f0ffc55970fba5de20e23f8ead881/packages/commonjs/src/transform-commonjs.js#L191-L200
if (isDefineCompiledEsm(node)) {
  if (programDepth === 3 && parent.type === "ExpressionStatement") {
    // skip special handling for [module.]exports until we know we render this
    skippedNodes.add(node.arguments[0]);
    topLevelDefineCompiledEsmExpressions.push(node);
  } else {
    shouldWrap = true;
  }
  return;
}

// https://github.com/rollup/plugins/blob/02fb349d315f0ffc55970fba5de20e23f8ead881/packages/commonjs/src/ast-utils.js#L111-L123
export function hasDefineEsmProperty(node) {
  return node.properties.some((property) => {
    if (
      property.type === "Property" &&
      property.key.type === "Identifier" &&
      property.key.name === "__esModule" &&
      isTruthy(property.value)
    ) {
      return true;
    }
    return false;
  });
}

// https://github.com/rollup/plugins/blob/02fb349d315f0ffc55970fba5de20e23f8ead881/packages/commonjs/src/ast-utils.js#L61-L70
export const KEY_COMPILED_ESM = "__esModule";

export function isDefineCompiledEsm(node) {
  const definedProperty =
    getDefinePropertyCallName(node, "exports") ||
    getDefinePropertyCallName(node, "module.exports");
  if (definedProperty && definedProperty.key === KEY_COMPILED_ESM) {
    return isTruthy(definedProperty.value);
  }
  return false;
}
```

demo 报错的罪魁祸首是 bar 比 foo 多出来的那段代码：

```js
module.exports = require("./bar");
```

和 ES Module 不同的是，前者可以通过静态分析出依赖关系和导出对象，而 CommonJS 要等到运行时才能确定。这就导致`module.exports = require('./bar')`在语法层面缺少 \_\_esModule: true 属性，Rollup 只分析 AST 的话无法直接检测到。

我们单独做一个测试，用 node 验证一下：

```js
// test.js
const bar = require("bar");

console.log(Object.keys(bar)); // [ 'bar', 'default' ]
console.log(bar.__esModule); // true
```

此时，bar 模块的 \_\_esModule 属性为 true。

而如果将 defaultIsModuleExports 从 "auto" 改成 false

```js
// vite.config.js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    commonjsOptions: {
      include: /node_modules|libs/,
      defaultIsModuleExports: false,
    },
  },
});
```

vite build 可以正常运行:

```bash
Hi foo!
Hi fooDefault!
Hi bar!
Hi barDefault!
```

不过这样设置并不好，因为正常的 CommonJs 包并不会导出 exports.default 这么一个为了兼容 ES Module 而存在的属性。

作为第三方库的开发者，不应同时使用`__esModule: true` 和额外的 `module.exports = require('./index')` 这样的入口文件。

以 react 为例：

- https://unpkg.com/browse/react@17.0.2/cjs/react.development.js

react 目前是一个纯正的 CommonJs 包，一般我们这样使用：

```js
import * as React from "react";
import { Suspense } from "react";
```

> 至于平时的`import React from 'react'`写法是 webpack、tsc 等工具做了特殊处理，统一包装成 { default: ... } 形式，补上了 default 字段，而且 React 的 API 都挂在 React 对象上，其本身不作为函数被调用。

react-activation 既有 `__esModule: true` 和 exports.default（因为它的源码使用了 ESM，打包时使用 Rollup 做了转换），同时也仿照 react 定义了一个 index.js：

```js
//  https://github.com/CJY0208/react-activation/blob/bd010077fdf1c20cbf45fea24fc0d25c048919b2/index.js
if (process.env.NODE_ENV === "production") {
  module.exports = require("./lib/index.min.js");
} else {
  module.exports = require("./lib/index.js");
}

import KeepAlive from "react-activation";

<KeepAlive></KeepAlive>;
```

所以产生了报错。

## 结论

所以使用 Vite 过程中遇到 CommonJS 兼容问题怎么解决呢？我们可以给 `react-activation` 这样的库提 Issue 或 PR，避免既导出为 CommonJS，又让调用方通过默认导入的形式使用，问题的锅不在 Vite。

与开发模式不同，Vite 生产构建时，CommonJS 模块的转换由 Rollup 接手处理，@rollup/plugin-commonjs 转换时依赖 exports.**esModule。开发模式不报错，是因为存在冗余的运行时判断，凡是默认导入的 CommonJS 包都会加上三目运算符检查**esModule 属性。

```js
import __vite__cjsImport3_reactActivation from "/node_modules/.vite/react-activation.js?v=5ba8f290";
const KeepAlive = __vite__cjsImport3_reactActivation.__esModule
  ? __vite__cjsImport3_reactActivation.default
  : __vite__cjsImport3_reactActivation;
```

> 相关 Vite 代码

```js
// https://github.com/vitejs/vite/blob/d2887729911d52e3117a7649e85460b346f04b54/packages/vite/src/node/plugins/importAnalysis.ts#L685-L688

} else if (importedName === 'default') {
 lines.push(
   `const ${localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`
 )
} else {
 lines.push(`const ${localName} = ${cjsModuleName}["${importedName}"]`)
}
```
