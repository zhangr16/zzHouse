#!/bin/sh
set -eu
rm -rf dist
mkdir -p dist
cp -R index.html portal.css cloud-worship cloud-fishing food-fun not-a-leek dist/
