---
title: vitepress博客
description: blog GithubPages
aside: false
date: 2022-11-18
tags:
  - vitepress
---

最近想搞一个个人博客，看了一圈下来发现常见的有 vuepress 和 vitepress，其中 vitepress 主题更好看，那就是它了！

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

6. 添加脚本

```json
  "scripts": {
    "dev": "vitepress dev",
    "build": "vitepress build",
    "serve": "vitepress serve"
  },
```
