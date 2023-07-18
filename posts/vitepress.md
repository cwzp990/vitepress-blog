---
title: vitepress博客
description: blog GithubPages
aside: false
date: 2022-11-18
tags:
  - blog
---

之前是在 gitee 上部署，结果需要上传身份证，甚是麻烦，现迁移到 github 上

## 构建 vitepress 项目

1. 新建文件夹

```bash
mkdir vitepress-blog
```

2. 使用编译器打开该文件夹
3. 打开终端
4. 初始化项目

```bash
yarn init
```

5. 本地安装 VitePress

```bash
yarn add vitepress --dev
```

6. 编写脚本

```bash
#! /usr/bin/env sh

set -o
yarn run build

cd .vitepress/dist

git init
git add -A
git commit -m "deploy"

git push -f git@github.com:cwzp990/vitepress-blog.git master:gh-pages

cd -

rm -rf .vitepress/dist
```

7. 添加脚本

```json
  "scripts": {
    "deploy": "bash deploy.sh",
    "dev": "vitepress dev",
    "build": "vitepress build",
    "serve": "vitepress serve"
  },
```
