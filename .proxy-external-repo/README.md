# Internationalization for Grafana Plugins

Grafana currently supports multiple languages in its interface which plugins can take advantage of and hook into. This repository provides different levels of opt-in tooling to make the process of internationalizing your plugin easier.

You can choose to use as much of the provided tooling as you want, or none at all. The tooling is provided to make the process easier and more streamlined with an opinionated approach.

The approach is heavily based on the workflow for translating Grafana OSS.

## The bear minimum for your plugin to work with Grafana's internationalization

1. Add `src/locales/{country}-{language}/` folder to your plugin. e.g. `es-ES`, `pt-BR`, `de-DE`, `zh-Hans`, etc. It must be one of Grafana's supported languages.
2. Within this folder add a JSON file named after your plugin id. You can find your plugin id in your `plugin.json` file. e.g. for Synthetic Monitoring it would be `grafana-synthetic-monitoring-app.json`
3. Add the translations for your plugin in this file. Grafana uses the [i18next](https://www.i18next.com/) library for internationalization and follows the [default object notation key structure](https://www.i18next.com/translation-function/essentials).
4. Within your components utilize the `<i18n.Trans />` and `i18n.t()` functions provided by `@grafana/runtime` to translate your strings. More information on how to use these functions can be found in the [Grafana documentation](https://github.com/grafana/grafana/blob/main/contribute/internationalization.md).
5. Build and release your plugin and Grafana will do the rest of the work 🎉

> [!IMPORTANT]
> It is important to understand that the translations you provide Grafana will be namespaced by your plugin id. You should add your namespace when using the i18n functions to ensure you don't collide with other translation files that Grafana is using.
>
> The `t()` function key argument can be prefixed with the namespace id, e.g. `t("{pluginId}:translation.key.value")`. The `<Trans />` component accepts either the same prefix to its `i18nKey` prop or you can add a `namespace` prop instead.
> We recommend creating your own `<Trans />` and `t()` wrapper functions that automatically add the namespace to the key. You can choose to use the tooling below to help with this.

Ideally you should also provide a `src/locales/en-US/{pluginId}.json` file with the English translations for your plugin but it is not strictly necessary.

## Opt-in tooling

Adding translations to your plugin is the easy part. The difficult part is having a smooth workflow that your developers can follow to ensure that translations are added and updated as your plugin evolves.

1. ### Wrapped Namespace Functions

```
NAMESPACED_FUNCTIONS
- FILE_LOCATION: string (default "src/i18n.tsx")
```

The tooling will add namespaced `<Trans />` and `t()` functions to your plugin at the desired file location which you should use everywhere rather than the ones provided by `@grafana/runtime`. This file should not be modified as it will be overwritten by the tooling when you update. If you need to modify the file, you should opt out of this tooling to ensure your updates do not get overwritten when updating.

Provide an empty string to opt out of this tool.

```typescript
import { Trans, t } from 'src/i18n';

const MyComponent = () => {
  return <Trans i18nKey="your.translation.key" />;
};

const translatedString = t('your.translation');
```

2. ### Incremental Linting

```
INCREMENTAL_IMPROVEMENTS
  ON: boolean (default true)
  ADD_CI_CD_STEP: boolean (default true)
```

#### option `ON: true`

The tooling will install [`betterer`](https://phenomnomnominal.github.io/betterer/) and `@grafana/eslint-rules` with the custom rule `no-untranslated-strings`. It will run once on install to create a baseline of untranslated strings.

It will update the `./.config-i18n/Makefile` with the appropriate scripts and it will add two commands to your `package.json` file `scripts` section:

```
"i18n:betterer-local": "make -C ./.config-i18n i18n-betterer-local",
"i18n:betterer-cicd": "make -C ./.config-i18n i18n-betterer-cicd"
```

- `i18n:betterer-local` is intended to be run by the developer locally to ensure that no new untranslated strings have been added and if they would like to check before committing.
- `i18n:betterer-cicd` is intended to be be used for the CI/CD integration as it will throw an error if the test fails and block the PR from being merged.

_Why are there two commands?_

`i18n:betterer` updates the baseline of untranslated strings and writes them to the `./.config-i18n/.betterer.results` file. If it is run locally it will update the baseline after failing and the developer may accidentally commit the changes, so then when it runs in the CI/CD it won't pick up that the plugin's internationalization has gotten worse and pass the test.

#### option `ADD_CI_CD_STEP: true`

This option will add a GitHub action that will run the `yarn i18n:betterer` command on every pull request to ensure that no new untranslated strings are commited to the main branch. The tooling will add the CI/CD file to `.github/workflows/i18n-incremental.yml`. Any changes to this file will be overwritten when updating the tooling if you have opted in.

3. ### Extract Untranslated strings

```
EXTRACT_UNTRANSLATED_STRINGS
- ON: boolean (default true)
- ADD_CI_CD_STEP: boolean (default true)
```

#### option `ON: true`

The tooling will add two files:

- `./.config-i18n/i18next-parser.config.cjs`
- `./.config-i18n/psuedo.mjs`

It will update the `./.config-i18n/Makefile` with the appropriate script and it will add a command to your `package.json` file `scripts` section:

```
"i18n:extract": "make -C ./.config-i18n i18n-extract"
```

This command will extract all the untranslated strings from your plugin and update your `src/locales/en-US/{pluginId}.json` file with the new strings. It will also create/update a `src/locales/pseudo-LOCALE/{pluginId}.pseudo.json` file with the psuedo translations.

> [!NOTE]
> The psuedo translations are purely a development tool to ensure that your plugin is translating correctly. It is a useful visual aid to see what coverage you have for your translations. It is not available in production.

#### option `ADD_CI_CD_STEP: true`

This option will add a GitHub action that will run the `yarn i18n:extract` command on every pull request to ensure that the `en-US` translation file is up to date. The tooling will add the CI/CD file to `.github/workflows/i18n-extract.yml`. Any changes to this file will be overwritten when updating the tooling if you have opted in.

4. ### Crowdin upload

```
CROWDIN_UPLOAD
- ON: boolean (default true)
- ADD_CI_CD_STEP: boolean (default true)
```

#### option `ON: true`

The tooling will add `./.config-i18n/crowdin.yml`. This file will contain the configuration for the Crowdin CLI to upload your translations to the Grafana Crowdin project.

It will update the `./.config-i18n/Makefile` with the appropriate script and it will add a command to your `package.json` file `scripts` section:

```
"i18n:upload": "make -C ./.config-i18n i18n-upload"
```

There is a separate README file in the `.config-i18n` folder that will guide you through the process of setting up the Crowdin CLI and configuring the tooling to work with your Crowdin project.

#### option `ADD_CI_CD_STEP: true`

This option will add a GitHub action that will run the `yarn i18n:upload` command on every successfully merged PR to `main` to ensure that the translations are uploaded to Crowdin. The tooling will add the CI/CD file to `.github/workflows/i18n-upload.yml`. Any changes to this file will be overwritten when updating the tooling if you have opted in.

5. ### Crowdin download

```
CROWDIN_DOWNLOAD
- ON: boolean (default true)
- ADD_CI_CD_STEP: boolean (default true)
```

#### option `ON: true`

The tooling will add `./.config-i18n/crowdin.yml`. This file will contain the configuration for the Crowdin CLI to upload your translations to the Grafana Crowdin project.

It will update the `./.config-i18n/Makefile` with the appropriate script and it will add a command to your `package.json` file `scripts` section:

```
"i18n:download": "make -C ./.config-i18n i18n-download"
```

There is a separate README file in the `.config-i18n` folder that will guide you through the process of setting up the Crowdin CLI and configuring the tooling to work with your Crowdin project.

#### option `ADD_CI_CD_STEP: true`

This option will add a GitHub action that will run the `yarn i18n:download` command on every release branch to ensure that the translations in Crowdin are downloaded and bundled with the plugin. The tooling will add the CI/CD file to `.github/workflows/i18n-download.yml`. Any changes to this file will be overwritten when updating the tooling if you have opted in.

## FAQ

### Do I need to use this tooling to internationalize my plugin?

No. You are free to completely opt out of the process and handle internationalization on your own. You just have to follow the bear minimum steps at the start of this document to ensure your plugin works with Grafana's internationalization.

### Can I add a language that is not listed in the supported languages of Grafana?

Not currently. This may be an option in the future.

### Can I opt in/out of specific tooling after I have made my initial choice?

Yes. We keep a file within the `.config-i18n` folder (`options.json`) recording your opt-in choices. Update this file with your new choices and run `npx @grafana/config-i18n@latest update` to apply your new choices.

### I have added new translations to my plugin with no other code changes. Do I have to do a release so they are picked up by Grafana?

Yes. You will need to release a new version of your plugin for the translations to be picked up by Grafana. The translation files are static json files bundled with your plugin and there is no other way that Grafana will be aware of the translations you have provided.

### I want to use some of the tooling but with a different provider (e.g. not Crowdin or Github Actions). Is this possible?

No. The tooling is opinionated and is designed to work with the Grafana infrastructure. You are free to use the tooling as a base but opt out and modify it to suit your needs.

### How do I debug if my translations are working correctly?

In development Grafana provides a psuedo-locale that you can use to test your translations.

### Acknowledgements

This tooling is heavily inspired by the work done by the Grafana frontend team to internationalize Grafana. A huge thank you for their hard work and dedication in making Grafana accessible to everyone.

This project started as a hackthon project in the August 2024 hackathon. Thank you to the team for their hard work and dedication to making this project a reality.
