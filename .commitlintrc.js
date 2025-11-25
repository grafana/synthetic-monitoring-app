module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Match the types defined in release-please-config.json
    'type-enum': [2, 'always', ['chore', 'docs', 'feat', 'fix', 'refactor', 'release']],
  },
};
