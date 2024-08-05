# Grafana ESLint Rules

This package contains custom eslint rules for use within the Grafana codebase only. They're extremely specific to our codebase, and are of little use to anyone else. They're not published to NPM, and are consumed through the Yarn workspace.

## Rules

### `no-untranslated-strings`

Check if strings are marked for translation.

```tsx
// Bad ❌
<InlineToast placement="top" referenceElement={buttonRef.current}>
  Copied
</InlineToast>

// Good ✅
<InlineToast placement="top" referenceElement={buttonRef.current}>
  <Trans i18nKey="clipboard-button.inline-toast.success">Copied</Trans>
</InlineToast>

```

#### Passing variables to translations

```tsx
// Bad ❌
const SearchTitle = ({ term }) => <div>Results for {term}</div>;

// Good ✅
const SearchTitle = ({ term }) => <Trans i18nKey="search-page.results-title">Results for {{ term }}</Trans>;

// Good ✅ (if you need to interpolate variables inside nested components)
const SearchTerm = ({ term }) => <Text color="success">{term}</Text>;
const SearchTitle = ({ term }) => (
  <Trans i18nKey="search-page.results-title">
    Results for <SearchTerm term={term} />
  </Trans>
);

// Good ✅ (if you need to interpolate variables and additional translated strings inside nested components)
const SearchTitle = ({ term }) => (
  <Trans i18nKey="search-page.results-title" values={{ myVariable: term }}>
    Results for <Text color="success">{'{{ myVariable }}'} and this translated text is also in green</Text>
  </Trans>
);
```

#### How to translate props or attributes

Right now, we only check if a string is wrapped up by the `Trans` tag. We currently do not apply this rule to props, attributes or similar, but we also ask for them to be translated with the `t()` function.

```tsx
// Bad ❌
<input type="value" placeholder={'Username'} />;

// Good ✅
const placeholder = t('form.username-placeholder', 'Username');
return <input type="value" placeholder={placeholder} />;
```

Check more info about how translations work in Grafana in [Internationalization.md](https://github.com/grafana/grafana/blob/main/contribute/internationalization.md)
