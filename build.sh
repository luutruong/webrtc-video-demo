#/bin/bash

set -e

echo 'begin build typescript files'
tsc --project ./
echo ' -> ok'

if [[ ! -d "dist/public" ]]; then
  mkdir dist/public
fi

cp -af public/* ./dist/public