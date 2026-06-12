import { ApiEntry } from 'test/handlers/types';

// Grafana core's OFREP bulk evaluation endpoint, called once during
// initOpenFeature(). An empty flag set resolves every flag to its default.
export const evaluateFeatureFlags: ApiEntry = {
  route: /\/apis\/features\.grafana\.app\/v0alpha1\/namespaces\/[^/]+\/ofrep\/v1\/evaluate\/flags/,
  method: 'post',
  result: () => {
    return {
      json: {
        flags: [],
      },
    };
  },
};
