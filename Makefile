ROOT_DIR := $(shell git rev-parse --show-toplevel)
VERSION := $(shell grep version $(ROOT_DIR)/package.json | cut -d':' -f2 | tr -d "\"', \r")
PACKAGE_NAME := grafana-synthetic-monitoring-app-$(VERSION).zip

ARTIFACTS_DIR ?= $(ROOT_DIR)/artifacts/builds

.PHONY: build
build: build-go
	yarn build

# The plugin is a backend plugin, so `dist` is only complete once the Go
# binaries sit alongside the webpack output. `make package` zips `dist`
# wholesale, so skipping this would produce an archive that Grafana refuses to
# load.
.PHONY: build-go
build-go:
	mage -v buildAll

.PHONY: install
install:
	yarn install

.PHONY: lint
lint: lint-go
	yarn lint

# Backend tooling lives in Magefile.go under the `go:` namespace; run `mage -l`
# for the full set. These wrappers exist so that `make lint` and `make test`
# cover the backend too, instead of passing while Go code goes unchecked.
.PHONY: lint-go
lint-go:
	mage go:lint

# Regenerate .policy.yml from the pull_request workflows. `scripts/check-policy-bot-config`
# names this target in its CI failure message, so it needs to exist.
.PHONY: generate-policy-bot-config
generate-policy-bot-config:
	./scripts/gen-policy-bot-config

# requires GRAFANA_API_KEY
.PHONY: sign
sign:
	yarn sign

.PHONY: test
test: test-go
	yarn test

# End-to-end check that the backend binary actually loads inside Grafana. Needs
# Docker, so it is deliberately not part of `make test`; it runs in an isolated
# compose project and cleans up after itself.
.PHONY: validate-backend
validate-backend:
	./scripts/validate-backend

.PHONY: test-go
test-go:
	mage -v testRace

.PHONY: package
package:
	mkdir -p $(ARTIFACTS_DIR)/$(VERSION)
	ln -s dist grafana-synthetic-monitoring-app
	zip -r $(ARTIFACTS_DIR)/$(VERSION)/$(PACKAGE_NAME) grafana-synthetic-monitoring-app
	echo $(VERSION) > $(ROOT_DIR)/plugin_version.txt
	rm grafana-synthetic-monitoring-app
