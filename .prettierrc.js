module.exports = {
  // Prettier configuration provided by Grafana scaffolding
  ...require('./.config/.prettierrc.js'),
  overrides: [
    {
      files: '*.json5',
      options: {
        quoteProps: 'preserve',
        parser: 'json5',
        singleQuote: false,
        trailingComma: 'none',
      },
    },
  ],
};
