# Makefile

RIV_VERSION := 0.3-rc15

run-dev: node_modules
	npm run dev

node_modules:
	npm install && npm link cartesi-client

build:
	npm run build

reinstall-cartesi-client:
	npm link cartesi-client

update-rivemu:
	curl -s -L https://github.com/rives-io/riv/releases/download/v${RIV_VERSION}/rivemu.js -o public/rivemu.js
	curl -s -L https://github.com/rives-io/riv/releases/download/v${RIV_VERSION}/rivemu.wasm -o public/rivemu.wasm
