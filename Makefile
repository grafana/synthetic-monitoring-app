ROOT_DIR := $(shell git rev-parse --show-toplevel)
VERSION := $(shell grep version $(ROOT_DIR)/package.json | cut -d':' -f2 | tr -d "\"', \r")
PACKAGE_NAME := grafana-synthetic-monitoring-app-$(VERSION).zip

ARTIFACTS_DIR ?= $(ROOT_DIR)/artifacts/builds

.PHONY: build
build:
	yarn build

.PHONY: install
install:
	yarn install

.PHONY: lint
lint:
	yarn lint

# requires GRAFANA_API_KEY
.PHONY: sign
sign:
	yarn sign

.PHONY: test
test:
	yarn test

.PHONY: package
package:
	mkdir -p $(ARTIFACTS_DIR)/$(VERSION)
	ln -s dist grafana-synthetic-monitoring-app
	zip -r $(ARTIFACTS_DIR)/$(VERSION)/$(PACKAGE_NAME) grafana-synthetic-monitoring-app
	echo $(VERSION) > $(ROOT_DIR)/plugin_version.txt
	rm grafana-synthetic-monitoring-app
