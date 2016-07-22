#!/bin/bash
# this file is intentionally not executable, because it is a little bit dangerous.

git branch -D gh-pages
git checkout --orphan gh-pages

webpack -p
git add build/bundle.js
git commit -m "deploy"
git push -f origin gh-pages

git checkout master
