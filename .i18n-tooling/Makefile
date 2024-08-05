
.PHONY: i18n-extract
i18n-extract:
	@echo "Extracting i18n strings for the plugin"
	yarn run i18next --config ./.i18n-tooling/i18next-parser.config.cjs
	node ./pseudo.mjs

.PHONY: i18n-upload
i18n-upload:
	pwd
	@echo "Uploading source files to crowdin"
	crowdin config lint
	# crowdin upload sources

.PHONY: i18n-download
i18n-download:
	@echo "Download translation files from crowdin"
	yarn run crowdin --config ./.i18n-tooling/crowdin.yml pull --all
