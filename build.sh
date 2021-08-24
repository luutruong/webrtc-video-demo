#/bin/bash

set -e

tsc --project ./

if [[ ! -d "dist/public" ]]; then
  mkdir dist/public
fi

cp -af public/* ./dist/public