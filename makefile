.PHONY: install build run

ROOT := $(CURDIR)
STOCK_PORT ?= 3001
VF_PORT ?= 3002
PARENT_PORT ?= 3000

install:
	zsh -lic 'cd "$(ROOT)/stock-autonomy" && pnpm install'
	zsh -lic 'cd "$(ROOT)/virtual-flow" && pnpm install'
	zsh -lic 'cd "$(ROOT)/parent" && pnpm install'
	zsh -lic 'cd "$(ROOT)/stock-autonomy" && pnpm build'
	zsh -lic 'cd "$(ROOT)/virtual-flow" && pnpm build'

build:
	zsh -lic 'cd "$(ROOT)/stock-autonomy" && pnpm build'
	zsh -lic 'cd "$(ROOT)/virtual-flow" && pnpm build'

run:
	PARENT_PORT=$(PARENT_PORT) STOCK_PORT=$(STOCK_PORT) VF_PORT=$(VF_PORT) zsh -lic 'cd "$(ROOT)" && zsh scripts/run-all.sh'
