---
title: npm 相关回顾总结
description: npm node
aside: false
date: 2023-2-25
tags:
  - npm
---

## 前言

上家公司因为接触过脚手架项目，这里总结回顾一下项目中出现的问题。

## npm run xxx

我们知道，我们在 package.json 中是可以写一些脚本命令的，那其中具体发生了什么呢？

```json
{
  "name": "xxx",
  "private": true,
  "version": "0.0.0",
  "scripts": {
    "start": "vite",
    "build": "vue-tsc && vite build",
    "preview": "vite preview",
    "lint": "eslint . --ext .vue,.js,.ts,.jsx,.tsx --fix",
    "format": "prettier --write \"./**/*.{html,vue,ts,js,json,md}\"",
    "lint:style": "stylelint \"./**/*.{css,less,vue,html}\" --fix",
    "prepare": "husky install"
  },
  "dependencies": {},
  "devDependencies": {}
}
```

- 在我们执行 npm run start 的时候，实际上是在执行我们在 script 里面定义的命令，即 vite。那有人会问了，我的电脑上也没安装 vite，它是怎么调用的呢？

其实，我们在进入项目之后安装依赖的时候，npm 就会在 node_modules/.bin/ 目录中创建好 vite 为名的几个可执行文件了。如下图：

![](../images/WX20230718-110346%402x.png)

.bin 目录，这个目录不是任何一个 npm 包。目录下的文件，表示这是一个软链接，打开文件可以看到文件顶部写着 #!/bin/sh ，表示这是一个脚本：

![](../images/WX20230718-110659%402x.png)

现在我们知道，当使用 npm run start 执行 vite 时，虽然没有安装 vite 的全局命令，但是 npm 会到 ./node_modules/.bin 中找到 vite 文件作为脚本来执行。

- 那这个 bin 目录下的那些软连接文件是哪里来的呢？它又是怎么知道这条软连接是执行哪里的呢？

在我们安装 node_modules 时，遇到了 vite 这个第三方包，在它的 package.json 里有一个 bin 字段:

```json
{
  "name": "vite",
  "version": "4.0.2",
  "type": "module",
  "license": "MIT",
  "author": "Evan You",
  "description": "Native-ESM powered web dev build tool",
  "bin": {
    "vite": "bin/vite.js"
  },
  "main": "./dist/node/index.js",
  "module": "./dist/node/index.js",
  "types": "./dist/node/index.d.ts",
  ...
}
```

当我们 npm i 整个新建项目的时候，npm 将 bin/vite.js 作为 bin 声明了。

所以在 npm install 时，npm 读到该配置后，就将该文件软链接到 ./node_modules/.bin 目录下，而 npm 还会自动把 node_modules/.bin 加入$PATH，这样就可以直接作为命令运行依赖程序和开发依赖程序，不用全局安装了。

也就是说，npm i 的时候，npm 就帮我们把这种软连接配置好了，其实这种软连接相当于一种映射，执行 npm run xxx 的时候，就会到 node_modules/bin 中找对应的映射文件，然后再找到相应的 js 文件来执行.

## 生命周期钩子

这里借用很多框架的生命周期钩子的概念，其实 npm 也在不同的生命周期 提供了一些钩子，可以方便你在项目运行的不同时间点进行一些脚本的编写。

它的钩子分为两类：preXXX 和 postXXX ，前者是在脚本运行前，后者是在脚本运行后执行。所有的命令脚本都可以使用钩子（包括自定义的脚本）。例如：运行 npm run build，会按以下顺序执行：npm run prebuild --> npm run build --> npm run postbuild

pre 脚本和 post 脚本也是出口代码敏感(exit-code-sensitive) 的，这意味着如果您的 pre 脚本以非零出口代码退出，那么 NPM 将立即停止，并且不运行后续脚本。通常你可以在 pre 脚本上执行一些准备工作，在 post 脚本上执行一些后续操作。

所以我们可以在发布上线的时候，可以在 npm run postbuild 里写上上传服务器命令：

```json
{
  "script": {
    "postbuild": "rsync --delete -av ./dist/ web98:/home/wslgrp/clinic_prod/webapps/ROOT"
  }
}
```

这样在你打包之后就会自动上传前端文件到服务器，非常方便

## dependencies & devDependencies & peerDependencies

三者的区别：

- dependencies：src 源码中会使用到的

- devDependencies：仅开发时用的包，src 不会引入到的，当你的包被别人使用时，这里的依赖包是不会下载的

- peerDependencies：主要是用来做版本检查的，各个包管理工具处理情况不一致

注意对于我们的业务项目而言，是不需要区分 dependencies、devDependencies，实际情况是安装到哪里都可以的，也不需要设置 peerDependencies，三者只针对于 npm 包的开发者 而言才需要明白
