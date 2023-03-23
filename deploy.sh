#! /usr/bin/env sh

set -o
yarn run build

cd .vitepress/dist

git init
git add -A
git commit -m "deploy"

git push -f cwzp990@github.com:cwzp990/vitepress-blog.git master:gh-pages

cd -

rm -rf .vitepress/dist
