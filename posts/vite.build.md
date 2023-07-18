---
title: 构建工具迁移出现的问题
description: Vite 打包构建
aside: false
date: 2022-12-20
tags:
  - Vite
---

## 问题

最近，在将项目的构建工具从 webpack 迁移到了 Vite，开发和构建过程非常迅速，但部署时发现其静态文件在浏览器上报错了：

> Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: object.

但是之前用 webpack 打包是没有问题的，唯独 Vite 产生了报错。排查之后发现是项目中使用了第三方包`react-activation`引起的。

```jsx
import React, { useState } from "react";
import ReactDOM from "react-dom";
import KeepAlive, { AliveScope } from "react-activation";

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div>
      count: {count}
      <button onClick={() => setCount((count) => count + 1)}>add</button>
    </div>
  );
}

function App() {
  const [show, setShow] = useState(true);

  return (
    <AliveScope>
      <button onClick={() => setShow((show) => !show)}>Toggle</button>
      <div>without {`<KeepAlive>`}</div>
      {show && <Counter />}
      <div>with {`<KeepAlive>`}</div>
      {show && (
        <KeepAlive>
          <Counter />
        </KeepAlive>
      )}
    </AliveScope>
  );
}

ReactDOM.render(<App />, document.getElementById("root"));
```

报错的是 `<KeepAlive></KeepAlive>` 代码，但 KeepAlive 组件本身没有问题。

## 原因

要确定错误的原因很简单，从 React 报错的 Stack Trace 中点进去，设置断点，便可以发现：

![Alt](https://keqingrong.cn/assets/621caedd8290f95335363b70a131a2fb/react-activation-default-exports.png)

报错显示，这里的 KeepAlive 是个对象，而不是 React 期望的函数或者类。

修改模块的引入方式，问题解决：

```js
import KeepAlive from "react-activation";
// 改为
import { KeepAlive } from "react-activation";
```

## 反思

问题虽然解决了，但可以想想其中的缘由。

### react-activation 是如何导出模块的

首先，我们去看看 react-activation 的导出：

```js
// https://github.com/CJY0208/react-activation/blob/bd010077fdf1c20cbf45fea24fc0d25c048919b2/src/index.js#L12-L25

// src/index.js
export default KeepAlive;
export {
  KeepAlive,
  AliveScope,
  withActivation,
  fixContext,
  autoFixContext,
  useActivate,
  useUnactivate,
  createContext,
  withAliveScope,
  useAliveController,
  NodeKey,
};
```

导出了所有对外 Api，同时将 KeepAlive 作为默认导出，构建后变成：

```js
// https://unpkg.com/browse/react-activation@0.9.5/lib/index.js

// lib/index.js
Object.defineProperty(exports, "__esModule", { value: true });

exports.AliveScope = AliveScope;
exports.KeepAlive = KeepAlive$1;
exports.NodeKey = NodeKey;
exports.autoFixContext = autoFixContext;
exports.createContext = createContext;
exports.default = KeepAlive$1;
exports.fixContext = fixContext;
exports.useActivate = useActivate;
exports.useAliveController = useAliveController;
exports.useUnactivate = useUnactivate;
exports.withActivation = withActivation;
exports.withAliveScope = withAliveScope;
```

再看看它的入口文件：

```js
// https://github.com/CJY0208/react-activation/blob/bd010077fdf1c20cbf45fea24fc0d25c048919b2/index.js#L3-L7

// index.js
if (process.env.NODE_ENV === "production") {
  module.exports = require("./lib/index.min.js");
} else {
  module.exports = require("./lib/index.js");
}
```

可以发现，它是采用的 CommonJs 模块导出方式。

### Vite 的构建过程

对于下面的代码：

```js
import KeepAlive from "react-activation";
```

在开发模式下，Vite 将会处理成：

```js
import __vite__cjsImport3_reactActivation from "/node_modules/.vite/react-activation.js?v=5ba8f290";
const KeepAlive = __vite__cjsImport3_reactActivation.__esModule
  ? __vite__cjsImport3_reactActivation.default
  : __vite__cjsImport3_reactActivation;
```

这里的 KeepAlive 始终是函数。

但是在生产模式下，Vite 是这样构建的：

```js
import {
  j as jsxRuntime,
  r as react,
  K as KeepAlive,
  R as ReactDOM,
  a as reactActivation,
} from "./vendor.8e846e2e.js";
// ...
const jsx = jsxRuntime.exports.jsx;
const jsxs = jsxRuntime.exports.jsxs;
function Counter() {
  const [count, setCount] = react.exports.useState(0);
  return /* @__PURE__ */ jsxs("div", {
    children: [
      /* @__PURE__ */ jsxs("p", {
        children: ["count: ", count],
      }),
      /* @__PURE__ */ jsx("button", {
        onClick: () => setCount((count2) => count2 + 1),
        children: "Add",
      }),
    ],
  });
}
function App() {
  const [show, setShow] = react.exports.useState(true);
  return /* @__PURE__ */ jsxs("div", {
    children: [
      /* @__PURE__ */ jsx("button", {
        onClick: () => setShow((show2) => !show2),
        children: "Toggle",
      }),
      show &&
        /* @__PURE__ */ jsx(KeepAlive, {
          children: /* @__PURE__ */ jsx(Counter, {}),
        }),
    ],
  });
}
ReactDOM.render(
  /* @__PURE__ */ jsx(reactActivation.exports.AliveScope, {
    children: /* @__PURE__ */ jsx(App, {}),
  }),
  document.getElementById("root")
);
```

```js
// vendor.8e846e2e.js
// ...
var reactActivation = { exports: {} };
// ...
var KeepAlive = reactActivation.exports;
// ...
export {
  KeepAlive as K,
  ReactDOM as R,
  reactActivation as a,
  jsxRuntime as j,
  react as r,
};
```

这里的 KeepAlive 实际上是：

```js
{
  AliveScope: ƒ ()
  KeepAlive: ƒ ()
  NodeKey: ƒ ()
  autoFixContext: ƒ ()
  createContext: ƒ ()
  default: ƒ ()
  fixContext: ƒ ()
  useActivate: ƒ ()
  useAliveController: ƒ ()
  useUnactivate: ƒ ()
  withActivation: ƒ ()
  withAliveScope: ƒ ()
  __esModule: true
}
```

所以才会报错`Element type is invalid`

Vite 在生产模式下使用 Rollup 对应用进行打包，在处理 react-activation 模块时缺失了对 \_\_esModule 的判断和对 default 属性的处理，导致开发和构建不一致。

### Vite 与 webpack 的区别

webpack 会将 ES Module 和 CommonJS 全部统一处理成 ComomJS，最后的 bundle 文件中是级联的 CommonJS 模块，运行时根据 \_\_esModule 判断原模块是否是 ES Module。Vite 和 webpack 走的是相反的一条路，它将 CommonJS 转成 ES Module。

## 总结

export default 的问题，归根结底是 CommonJS 和 ES Module 的互操作性问题，二者不完全兼容。也就是 `import KeepAlive from 'react-activation'`和 `const reactActivation = require('react-activation')`不是直接对应关系。

两者的关系，如下：

- 默认导入：

```js
import KeepAlive from "react-activation";
// 近似于
const KeepAlive = require("react-activation").default;
```

- 命名空间导入

```js
import * as reactActivation from "react-activation";
// 近似于
const reactActivation = require("react-activation");
```

- 有名导入

```js
import { KeepAlive } from "react-activation";
// 近似于
const { KeepAlive } = require("react-activation");
```

如今浏览器和 Node.js 都已原生支持 ES Module，但 npm 上依然有着存量巨大的 CommonJS 包，为了避免互操作时掉进默认导出的坑，日常开发更推荐使用有名导出。
