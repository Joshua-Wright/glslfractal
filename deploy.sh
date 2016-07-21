#!/bin/bash

git checkout gh-pages

webpack -p
git add build/bundle.js
git commit -m "deploy"
git push origin gh-pages

git checkout master
