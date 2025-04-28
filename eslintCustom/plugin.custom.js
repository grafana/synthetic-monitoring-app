const trackingEventCreationRule = require('./rule.trackingEventCreation');

const plugin = {
  rules: {
    'tracking-event-creation': trackingEventCreationRule,
  },
};
module.exports = plugin;
