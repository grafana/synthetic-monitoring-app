import { ApiEntry } from 'test/handlers/types';

// OFREP bulk evaluation endpoint hit during initOpenFeature(); empty set = all defaults.
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
