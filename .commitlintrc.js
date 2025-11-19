module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Add 'release' type to the conventional commit types
    'type-enum': [
      2,
      'always',
      [
        'build',
        'chore',
        'ci',
        'docs',
        'feat',
        'fix',
        'perf',
        'refactor',
        'release', // Added for release-please
        'revert',
        'style',
        'test',
      ],
    ],
  },
};
