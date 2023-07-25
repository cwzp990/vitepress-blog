---
title: monorepo架构改造公司SDK
description: monorepo pnpm
aside: false
date: 2023-5-31
tags:
  - monorepo
---

## 前言

公司想要把 SDK 暴露出去，给合作公司调用，另外，我们需要把模型操作相关代码以插件的形式供团队调用，最近 monorepo 架构比较流行，借助 pnpm，我们可以将其改造一下。

## 什么是 monorepo

简单来说就是，将多个项目或包文件放到一个 git 仓库来管理。 目前比较广泛应用的是 yarn+lerna 的方式实现 monorepo 的管理。 一个简单的 monorepo 的目录结构类似这样：

```js
.
├── README.md
├── lerna.json
├── package-lock.json
├── package.json
├── packages
│   ├── @soonspacejs
│   │   ├── plugin-camera-follower
│   │   ├── plugin-clipping-controls
│   │   ├── plugin-drawing-shape
│   │   ├── plugin-drawing-topology
│   │   ├── plugin-effect
│   └── soonspacejs
│       ├── README.md
│       ├── package.json
│       └── src
├── rollup.config.js
└── tsconfig.json
```

> 如上图，我们把 threejs 相关代码放到 soonspacejs 文件里，一些绘制、操作模型的代码以插件形式放到@soonspacejs 文件里。

之所以应用 monorepo，主要是解决以下问题：

- 代码复用的问题

- 开发流程统一

- 高效管理多项目/包

## pnpm

pnpm 相对于 yarn/npm 的优势

- 安装速度最快（非扁平的包结构，没有 yarn/npm 的复杂的扁平算法，且只更新变化的文件）

- 节省磁盘空间 （统一安装包到磁盘的某个位置，项目中的 node_modules 通过硬连接的方式链接到实际的安装地址）

## pnpm workspace 实践

### 1. 新建仓库并初始化

新建目录 pnpm-workspace-demo，执行 npm init / pnpm init 初始化项目，生成 package.json

### 2. 指定项目运行的 Node、pnpm 版本

为了减少因 node 或 pnpm 的版本的差异而产生开发环境错误，我们在 package.json 中增加 engines 字段来限制版本。

```json
{
  "engines": {
    "node": ">=16",
    "pnpm": ">=7"
  }
}
```

### 3. 安全性设置

为了防止我们的根目录被当作包发布，我们需要在 package.json 加入如下设置：

```json
{
  "private": true
}
```

pnpm 本身就支持 monorepo，不用另外安装第三方包。每个 monorepo 的根目录下必须包含 pnpm-workspace.yaml 文件

```yaml
packages:
  # all packages in direct subdirs of packages/
  - "packages/*"
```

### 4. 安装包

**全局依赖包**

有些依赖包需要安装到根目录，比如 threejs、rollup、chalk、inquirer、typescript 等，运行一下命令：

```bash
pnpm add rollup chalk inquirer typescript -Dw
```

-w 表示在 workspace 的根目录下安装而不是当前的目录

与安装命令 pnpm add pkgname 相反的的删除依赖包 pnpm rm/remove pkgname 或 pnpm un/uninstall pkgname

**子包依赖**

有两种方法，一个是进入子包目录直接安装 pnpm add pkgname，另一个通过-f 指定范围：

`pnpm --filter/-F 具体包目录名/包的name/正则匹配包名/匹配目录 command`

如：pnpm -f @soonspace/plugin-camera-follower add soonspacejs

## pnpm 和 npm 的区别

目前，使用 npm/yarn 安装包是扁平结构（以前是嵌套结构，npm3 之后改为扁平结构）

扁平结构 就是安装一个包，那么这个包依赖的包将一起被安装到与这个包同级的目录下。比如安装一个 koa 包，打开目录下的 node_modules 会发现除了 koa 之外，多出很多其他的包。如图：

![](../images/WX20230725-212348%402x.png)

嵌套结构 就是一个包的依赖包会安装在这个包文件下的 node_modules 下，而依赖的依赖会安装到依赖包文件的 node_modules 下。依此类推。如下所示:

```js
node_modules
├─ foo
  ├─ node_modules
     ├─ bar
       ├─ index.js
       └─ package.json
  ├─ index.js
  └─ package.json
```

嵌套结构的问题在于：

- 包文件的目录可能会非常长

- 重复安装包

- 相同包的实例不能共享

而扁平结构也同样存在问题：

- 依赖结构的不确定性（不同包依赖某个包的不同版本 最终安装的版本具有不确定性）可通过 lock 文件确定安装版本

- 扁平化算法复杂，耗时

- 非法访问未声明的包

现在，我们使用 pnpm 来安装 koa，然后打开 node_modules：

![](../images/WX20230725-212849%402x.png)

从上图可以发现：

- node_modules 下只有 koa 一个包，且这个被软链到了其他的地方。

- .modlues.yaml 包含了一些 pnpm 包管理的配置信息。如下图:

![](../images/WX20230725-213138%402x.png)

可以看到 .pnpm 目录的实际指向的 pnpm store 的路径、pnpm 包的版本等信息

![](../images/WX20230725-220746%402x.png)

由上图我们可以了解到：

- 当我们安装 bar 包时，根目录下只包含安装的包 bar

- 而 node_modules 目录下的 bar 包会软链接到.pnpm/bar/node_modules/bar@\*

- bar 的依赖包 foo 会被提升到.pnpm 的根目录下，其他包依赖 foo 时也会软链接到这里

- 而 bar 和 foo 实际通过硬链接到.pnpm store 中

> 软链接可以理解成快捷方式。 它和 windows 下的快捷方式的作用是一样的。 硬链接等于 cp -p 加 同步更新。即文件大小和创建时间与源文件相同，源文件修改，硬链接的文件会同步更新。应用：可以防止别人误删你的源文件

软链接解决了磁盘空间占用的问题，而硬链接解决了包的同步更新和统一管理问题。 还有一个巧妙的设计就是：将安装包和依赖包放在同一级目录下，即.pnpm/依赖包/node_modules 下。这个设计也就防止了 **依赖包间的非法访问**，根据 Node 模块路径解析规则可知，不在安装包同级的依赖包无法被访问，即只能访问安装包依赖的包。

如果你还有使用 npm/yarn 的场景，那么，可以推荐使用 **ni** 这个工具，它可以帮你自动识别项目使用的包管理工具，你只需要一行命名就搞定了。

比如： 执行命令 ni 安装依赖包，如果当前项目包含 pnpm-lock.yaml，那么会使用 pnpm install 执行安装命令，否则判断是否包含 package-lock.json/yarn.lock/bun.lockb，来确定使用哪个包管理工具去执行安装命令。
