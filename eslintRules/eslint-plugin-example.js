// eslint-plugin-example.js

const fooBarRule = require('./enforce-foo-bar');
const plugin = { rules: { 'enforce-foo-bar': fooBarRule } };
module.exports = plugin;
