# Analytics

For the continued success of Synthetic Monitoring, we need to understand how our users are using the product. We do this through a mixture of explicit and implicit event tracking. For explicit event tracking we use __Rudderstack__ and for implicit event tracking we use __FullStory__.

## How to add an explicit event

_This framework is based on the Grafana 12 hackathon project which can be [found here](https://github.com/grafana/grafana/pull/101697). Steps are being taken to expose the `createEventFactory` function in the `@grafana/runtime` package in the future so this is both an effort to standardise our events and a stop gap until that happens._

The `@grafana/runtime` package provides a `reportInteraction` function which should __not__ be used directly. You will receive a lint error if you try to use it.

Instead, you should use the `createSMEventFactory` function to create an event factory for your feature. It is a wrapper around `createEventFactory` (which is what is likely to be exposed in the `@grafana/runtime` package in the future) so our events are standardised and follow a consistent pattern:

```md
synthetic-monitoring_{FEATURE_NAME}_{EVENT_NAME}
```

Where `{FEATURE_NAME}` is the name of the feature and `{EVENT_NAME}` is the name of the event. You can find the list of all events across the whole codebase in the [analytics-events.md](./analytics-events.md) file.

For each feature you wish to track, create a new file in the `src/features/tracking` directory and add the event factory to it.

### Event naming convention

1. Use snake_case for the feature and event names
2. Be clear when the event being tracked is a UI component interaction (such as `button_clicked`) or the result of a user action (such as `check_created` or `check_updated`)
3. Avoid overly long feature and event names
4. Do not use variables or any other high cardinality properties in the feature or event name. The eslint rule is configured to catch this.

### Generating the analytics-events.md file

To generate the `analytics-events.md` file, run the following command:

```bash
yarn analytics-events:generate
```

This will generate the `analytics-events.md` file in the `docs/analytics` directory. Do not edit it directly - if it needs to be updated, edit the events and their JSDoc comments then run the command again.

## Instrumenting implicit events

Our implicit event tracking is done through FullStory. It uses `data-fs-element` data attributes and the full documentation can be found [here](https://developer.fullstory.com/mobile/android/fullcapture/set-element-properties/).








