module.exports = {
  // TODD: enable the before init hooks once grafana/toolkit can limit the jest workers
  // hooks: {
  //   'before:init': ['yarn build'],
  // },
  git: {
    commitMessage: 'chore: release v${version} [skip ci]',
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
