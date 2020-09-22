module.exports = {
  hooks: {
    'before:init': ['yarn build'],
  },
  npm: {
    publish: false,
  },
};
