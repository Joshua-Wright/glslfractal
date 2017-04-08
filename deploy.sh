#!/bin/bash
# this file is intentionally not executable, because it is a little bit dangerous.

git branch -D gh-pages
git checkout --orphan gh-pages

webpack -p
git add -f build/bundle.js
git add -f build/bundle.js.map
git commit -m "deploy"
git push -f origin gh-pages

git checkout master
