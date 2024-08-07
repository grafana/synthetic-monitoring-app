
.PHONY: i18n-extract
i18n-extract:
	@echo "Extracting i18n strings for the plugin"
	yarn run i18next --config ./.config-i18n/i18next-parser.config.cjs
	node ./pseudo.mjs

.PHONY: i18n-upload
i18n-upload:
	@echo "Uploading source files to crowdin"
	crowdin config lint
	crowdin upload sources

.PHONY: i18n-download
i18n-download:
	@echo "Download translation files from crowdin"
	crowdin pull --all

.PHONY: i18n-betterer-setup
i18n-betterer-setup:
	betterer ./.config-i18n 

.PHONY: i18n-betterer-cicd
i18n-betterer-cicd:
	betterer --update --silent --config ../.betterer.ts --results ../.betterer.results

.PHONY: i18n-betterer-local
i18n-betterer-local:
	@echo "Checking for betterer i18n strings"
	rm -f .betterer.results-temp
	cp ../.betterer.results .betterer.results-temp
	# run betterer and if it errors remove the temp file
	betterer --config ../.betterer.ts --results .betterer.results-temp || rm -f .betterer.results-temp

	# if it succeeds remove the temp file
	rm -f .betterer.results-temp
