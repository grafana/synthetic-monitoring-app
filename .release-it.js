module.exports = {
  hooks: {
    'before:init': ['yarn build', 'yarn test'],
  },
  git: {
    commitMessage: 'chore: release v${version}',
    tag: false,
  },
  github: {
    release: false,
  },
  npm: {
    publish: false,
  },
  plugins: {
    '@release-it/conventional-changelog': {
      preset: 'angular',
      infile: 'CHANGELOG.md',
    },
  },
};
