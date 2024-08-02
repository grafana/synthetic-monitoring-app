ROOT_DIR := $(shell git rev-parse --show-toplevel)
VERSION := $(shell grep version $(ROOT_DIR)/package.json | cut -d':' -f2 | tr -d "\"', \r")
PACKAGE_NAME := grafana-synthetic-monitoring-app-$(VERSION).zip
PACKAGE_NAME_LATEST := grafana-synthetic-monitoring-app-latest.zip
ARTIFACTS_DIR ?= $(ROOT_DIR)/artifacts/builds
PROM_VERSION := 2.48.1

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
test:  # install-promql-deps test-promql
	yarn test

# yarn tsc prints a lot of errors even if queries.js is generated successfully,
# so drop stdout (keeping stderr) and do an explicit test to see if the file
# was created.
scripts/node-generate/queries.js: src/queries.ts
	rm -f scripts/node-generate/queries.js ;\
	yarn tsc --outDir scripts/node-generate --pretty false src/queries.ts >/dev/null ;\
	test -f scripts/node-generate/queries.js && echo 'Ignore error above, file generated successfully'

rules.json: scripts/node-generate/queries.js
	node scripts/node-generate/node-generate.js

rules.yml: rules.json
	if yq -h | grep "jq wrapper for YAML documents" > /dev/null; then \
  		yq -y . rules.json > rules.yml; \
  	else \
		yq -Poy rules.json > rules.yml; \
	fi
	rm rules.json

test-promql: rules.yml
	promtool check rules --lint=all --lint-fatal rules.yml

.PHONY: install-promql-deps
install-promql-deps:
	wget -q https://github.com/prometheus/prometheus/releases/download/v$(PROM_VERSION)/prometheus-$(PROM_VERSION).linux-amd64.tar.gz
	tar xvf prometheus-$(PROM_VERSION).linux-amd64.tar.gz prometheus-$(PROM_VERSION).linux-amd64/promtool
	mv prometheus-$(PROM_VERSION).linux-amd64/promtool /usr/local/bin
	wget -q https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64 -O /usr/local/bin/yq
	chmod +x /usr/local/bin/yq

.PHONY: package
package:
	mkdir -p $(ARTIFACTS_DIR)/$(VERSION)
	ln -s dist grafana-synthetic-monitoring-app
	zip -r $(ARTIFACTS_DIR)/$(VERSION)/$(PACKAGE_NAME) grafana-synthetic-monitoring-app
	echo $(VERSION) > $(ROOT_DIR)/plugin_version.txt
	rm grafana-synthetic-monitoring-app

.PHONY: gh-release
gh-release:
	node ./scripts/github-release.js

.PHONY: package-latest
package-latest:
	mkdir -p $(ARTIFACTS_DIR)
	ln -s dist grafana-synthetic-monitoring-app
	zip -r $(ARTIFACTS_DIR)/$(PACKAGE_NAME_LATEST) grafana-synthetic-monitoring-app
	rm grafana-synthetic-monitoring-app

.PHONY: generate-version
generate-version:
	$(ROOT_DIR)/scripts/plugin-version-hash.sh

.PHONY: i18n-extract
i18n-extract:
	@echo "Extracting i18n strings for the plugin"
	yarn run i18next --config ./src/locales/i18next-parser.config.cjs
