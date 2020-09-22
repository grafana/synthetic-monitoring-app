module.exports = {
  hooks: {
    'before:init': ['yarn build'],
  },
  git: {
    commitMessage: 'chore: release v${version} [skip ci]',
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
