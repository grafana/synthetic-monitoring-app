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
	cp .betterer.results .betterer.results-temp
	# run betterer and if it errors remove the temp file
	betterer --results .betterer.results-temp || rm -f .betterer.results-temp

	# if it succeeds remove the temp file
	rm -f .betterer.results-temp
