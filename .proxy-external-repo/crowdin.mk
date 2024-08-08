
.PHONY: i18n-upload
i18n-upload:
	@echo "Uploading source files to crowdin"
	crowdin config lint
	crowdin upload sources

.PHONY: i18n-download
i18n-download:
	@echo "Download translation files from crowdin"
	crowdin pull --all
