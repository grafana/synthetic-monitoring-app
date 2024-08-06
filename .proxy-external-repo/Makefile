.PHONY: i18n-extract
i18n-extract:
	@echo "Extracting i18n strings for the plugin"
	yarn run i18next --config ./.config-i18n/i18next-parser.config.cjs
	node ./pseudo.mjs

include betterer.mk
include crowdin.mk
