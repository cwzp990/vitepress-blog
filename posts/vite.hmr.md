---
title: Vite HMR原理
description: Vite HMR
aside: false
date: 2023-1-18
tags:
  - Vite
---

Vite 是最近比较流行的前端构建工具，相比于 webpack，它有很多的优点。这里想介绍一下两者相关 HMR 的区别。

## webpack 的 HMR 过程

webpack 的 HMR 是由 webpack-dev-server 实现的。

首先，我们先对 HMR 建立一个基础的认知。HMR 全称叫 Hot Module Replacement。相比较 live load，它具有以下优点：

- 可以实现局部更新，避免多余的资源请求，提高开发效率
- 在更新的时候可以保存应用原有状态
- 在代码修改和页面更新方面，实现所见即所得

而在 webpack 中实现 HMR 的核心就是 HotModuleReplacementPlugin，它是 webpack 内置的 plugin。在我们平常开发中，之所以改一个文件，例如 .vue 文件，会触发 HMR，是因为在 vue-loader 中已经内置了使用 HotModuleReplacementPlugin 的逻辑。

### 举例

- .vue

```html
<template>
  <div>hello world</div>
</template>
<script lang="ts">
  import { Vue, Component } from "vue-property-decorator";
  @Component
  export default class Helloworld extends Vue() {}
</script>
```

- 手动实现 HMR 的效果

```js
import Vue from 'vue'
import HelloWorld from '_c/HelloWorld'

if (module.hot) {
  module.hot.accept('_c/HelloWorld', ()=>{
    // 拉取更新过的 HelloWorld.vue 文件
  })
}

new Vue({
  el: '#app',
  template: '<HelloWorld/>'
  component: { HelloWorld }
})
```

上面是手动实现 HMR 的效果，底层原理有俩个关键的点：

- 与本地服务器建立「socket」连接，注册 hash 和 ok 两个事件，发生文件修改时，给客户端推送 hash 事件。客户端根据 hash 事件中返回的参数来拉取更新后的文件。

- HotModuleReplacementPlugin 会在文件修改后，生成两个文件，用于被客户端拉取使用。

```js
// hash.hot-update.json
{
	"c": {
		"chunkname": true
	},
	"h": "d69324ef62c3872485a2"
}

// chunkname.d69324ef62c3872485a2.hot-update.js

webpackHotUpdate("main",{
   "./src/test.js":
  (function(module, __webpack_exports__, __webpack_require__) {
    "use strict";
    eval(....)
  })
})
```

在这之前还会涉及到对原模块代码的注入，让它具备拉取文件的能力，这里我们先忽略。

## Vite 基于 ES Module 的 devServer

基于 ES Module 的 devServer 是 Vite 实现 HMR 的关键，它会做下面两件事。

- 初始化本地服务器

- 加载并执行对应的 Plugin，例如 sourceMapPlugin、moduleRewritePlugin、htmlRewritePlugin 等等。

本质上，devServer 做的最重要的一件事就是加载执行 Plugin。

- 拦截请求，处理 ES Module 语法相关的代码，转化为浏览器可识别的 ES Module 语法，例如第三方模块的 import 转化为 /@module/vue.js

- 对 .ts、.vue 进行即时的编译以及 sass 或 less 的预编译

- 建立模块间的导入导出关系，即 importeeMap 和客户端建立 socket 连接，用于实现 HMR

### 准备过程

- 首先，我们执行 vite 命令，实际上是在运行 cli.js 这个入口文件

```js
(async () => {
  const { help, h, mode, m, version, v } = argv
  ...
  const envMode = mode || m || defaultMode
  const options = await resolveOptions(envMode)
  // 开发环境下，我们会命中 runServer
  if (!options.command || options.command === 'serve') {
    runServe(options)
  } else if (options.command === 'build') {
    runBuild(options)
  } else if (options.command === 'optimize') {
    runOptimize(options)
  } else {
    console.error(chalk.red(`unknown command: ${options.command}`))
    process.exit(1)
  }
})()
async function runServe(options: UserConfig) {
  // 在 createServer() 的时候会对 HRM、serverConfig 之类的进行初始化
  const server = require('./server').createServer(options)
  ...
}
```

在这里，我们会执行`runServe()`，它的核心是调用 server.js 文件中的`createServer()`

```js
export function createServer(config: ServerConfig): Server {
  const {
    ...,
    enableEsbuild = true
  } = config

  const app = new Koa<State, Context>()
  const server = resolveServer(config, app.callback())
  const watcher = chokidar.watch(root, {
    ignored: [/\bnode_modules\b/, /\b\.git\b/]
  }) as HMRWatcher
  const resolver = createResolver(root, resolvers, alias)

  const context: ServerPluginContext = {
    ...
    watcher
    ...
  }

  app.use((ctx, next) => {
    Object.assign(ctx, context)
    ctx.read = cachedRead.bind(null, ctx)
    return next()
  })

  const resolvedPlugins = [
    ...,
    moduleRewritePlugin,
    hmrPlugin,
    ...
  ]
  // 核心逻辑执行 hmrPlugin
  resolvedPlugins.forEach((m) => m && m(context))

  const listen = server.listen.bind(server)
  server.listen = (async (port: number, ...args: any[]) => {
    ...
    }) as any

  return server
}
```

createServer 方法做了以下几件事：

- 创建一个 koa 实例

- 创建监听除了 node_modules 之外的文件的 watcher，并传入 context 中

- 将 context 上下文传入并调用每一个 Plugin

接下来就到了 Vite 的 HMR 过程！

### Vite 的 HMR 过程

在 vite 中 HMR 的实现是以 serverPluginHmr 这个 Plugin 为核心实现。这里我们以 .vue 文件的修改触发的 HMR 为例，这个过程会涉及三个 Plugin：serverPluginHtml、serverPluginHmr、serverPluginVue：

![Alt]: https://www.freesion.com/images/787/efefd4a700045a43512d1f0e71a5a6b3.png

#### serverPluginHtml

这个 Plugin 向 index.html 中注入了获取 hmr 模块的代码:

```js
export const htmlRewritePlugin: ServerPlugin = ({
  root,
  app,
  watcher,
  resolver,
  config
}) => {
  const devInjectionCode =
    `\n<script type="module">\n` +
    `import "${hmrClientPublicPath}"\n` +
    `window.process = { env: { NODE_ENV: ${JSON.stringify(
      config.mode || 'development'
    )} }}\n` +
    `</script>\n`

  const scriptRE = /(<script\b[^>]*>)([\s\S]*?)<\/script>/gm
  const srcRE = /\bsrc=(?:"([^"]+)"|'([^']+)'|([^'"\s]+)\b)/

  async function rewriteHtml(importer: string, html: string) {
    ...
    html = html!.replace(scriptRE, (matched, openTag, script) => {
      ...
      return injectScriptToHtml(html, devInjectionCode)
  }

  app.use(async (ctx, next) => {
    await next()
    ...

    if (ctx.response.is('html') && ctx.body) {
      const importer = ctx.path
      const html = await readBody(ctx.body)
      if (rewriteHtmlPluginCache.has(html)) {
        ...
      } else {
        if (!html) return
        // 在这里给 index.html 文件注入代码块
        ctx.body = await rewriteHtml(importer, html)
        rewriteHtmlPluginCache.set(html, ctx.body)
      }
      return
    }
  })

}
```

所以，当我们访问一个 vite 启动的项目的时候，我们会在 network 中看到服务器返回给我们的 index.html 中的代码会多了这么一段代码：

```html
<script type="module">
  import "/vite/hmr";
  window.process = { env: { NODE_ENV: "development" } };
</script>
```

而这一段代码，也是确保我们后续正常触发 HMR 的关键点。因为，在这里浏览器会向服务器发送请求获取 vite/hmr 模块，然后，在 serverPluginHmr 中会拦截`ctx.path==='/vite/hmr'`的请求，建立 socket 连接。

### serverPluginHmr

上面我们说了 serverPluginHmr 它会劫持导入 /vite/hmr 的请求，然后返回 client.js 文件。

1. 读取 cliten.js 文件，劫持导入 /vite/hmr 的请求

```js
export const hmrClientFilePath = path.resolve(
   __dirname,
   '../../client/client.js'
 )
 export const hmrClientPublicPath = `/vite/hmr`
 const hmrClient = fs
    .readFileSync(hmrClientFilePath, 'utf-8')
    .replace(`__SW_ENABLED__`, String(!!config.serviceWorker))

  app.use(async (ctx, next) => {
    if (ctx.path === hmrClientPublicPath) {
      ctx.type = 'js'
      ctx.status = 200
      ctx.body = hmrClient.replace(`__PORT__`, ctx.port.toString())
    } else {
      ...
    }
  })
```

这里通过 `readFileSync()` 读取 client.js 文件，然后分别替换读取到的文件内容（字符串），一个是用于判断是否支持 serviceWorker，另一个用于建立 socket 连接时的端口设置。

2. 定义了 send 方法，并赋值给 watcher.send，用于其他 Plugin 在热更新时向浏览器推送更新信息：

```js
const send = (watcher.send = (payload: HMRPayload) => {
  const stringified = JSON.stringify(payload, null, 2);
  debugHmr(`update: ${stringified}`);

  wss.clients.forEach((client) => {
    // OPEN 表示已经建立连接
    if (client.readyState === WebSocket.OPEN) {
      client.send(stringified);
    }
  });
});
```

3. client.js

它做了两件事：

- 建立和服务器的 socket 连接，监听 message 事件，拿到服务器推送的 data，例如我们只修改 .vue 文件:

```js
export interface UpdatePayload {
  type: 'js-update' | 'vue-reload' | 'vue-rerender' | 'style-update'
  path: string
  changeSrcPath: string
  timestamp: number
}
```

- 对不同的 data.type 执行不同的逻辑

```js
onst socketProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
const socketUrl = `${socketProtocol}://${location.hostname}:${__PORT__}`
const socket = new WebSocket(socketUrl, 'vite-hmr')
// 监听 message 事件，拿到服务端推送的 data
socket.addEventListener('message', async ({ data }) => {
  const payload = JSON.parse(data) as HMRPayload | MultiUpdatePayload
  if (payload.type === 'multi') {
    payload.updates.forEach(handleMessage)
  } else {
    // 通常情况下会命中这个逻辑
    handleMessage(payload)
  }
})
async function handleMessage(payload: HMRPayload) {
  const { path, changeSrcPath, timestamp } = payload as UpdatePayload
  ...
  switch (payload.type) {
    ...
    case 'vue-rerender':
      const templatePath = `${path}?type=template`
      ...
      import(`${templatePath}&t=${timestamp}`).then((m) => {
        __VUE_HMR_RUNTIME__.rerender(path, m.render)
        console.log(`[vite] ${path} template updated.`)
      })
      break
    ...
  }
}
```

### serverPluginVue

前面，我们讲了 serverPluginHtml 和 serverPluginHmr 在 HMR 过程会做的一些前期准备。然后，我们这次分析的修改 .vue 文件触发的 HMR 逻辑。

首先，它会解析 .vue 文件，做一些 compiler 处理，然后通过 watcher 监听 .vue 文件的修改:

```js
watcher.on("change", (file) => {
  if (file.endsWith(".vue")) {
    handleVueReload(file);
  }
});
```

可以看到在 change 事件的回调中调用了 handleVueReload()

```js
const handleVueReload = (watcher.handleVueReload = async (
    filePath: string,
    timestamp: number = Date.now(),
    content?: string
  ) => {
    const publicPath = resolver.fileToRequest(filePath)
    const cacheEntry = vueCache.get(filePath)
    const { send } = watcher
    ...
    let needRerender = false
    ...
    if (!isEqualBlock(descriptor.template, prevDescriptor.template)) {
      needRerender = true
    }
    ...
    if (needRerender) {
      send({
        type: 'vue-rerender',
        path: publicPath,
        changeSrcPath: publicPath,
        timestamp
      })
    }
  })
```

handleVueReload() 它会针对 .vue 文件中，不同情况走不同的逻辑。这里，我们只是修改了 .vue 文件，给它加了一行代码，那么此时就会命中 isEqualBlock() 为 false 的逻辑，所以 needRerender 为 true，最终通过 send() 方法向浏览器推送 type 为 vue-rerender 以及携带修改的文件路径的信息。然后，我们前面 client.js 中监听 message 的地方就会拿到对应的 data，再通过 import 发起获取该模块的请求。

### 总结

本文只是针对.vue 文件的修改分析了整个 HMR 的过程，其实还有.js、.css 等文件修改触发 HMR 的逻辑，其实其他的都大同小异。
