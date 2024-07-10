import React from 'react';
import runtime from '@grafana/runtime';
import { render, screen } from '@testing-library/react';

import { FeatureName } from 'types';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { useFeatureFlag } from './useFeatureFlag';

const CONFIG_FLAG = 'configFlag';
const URL_FLAG = 'urlFlag';

jest.replaceProperty(runtime, `config`, {
  featureToggles: {
    // changing this key to use the declared const variable results in undefined
    // @ts-expect-error
    configFlag: { live: true },
  },
});

jest.mock('@grafana/data', () => ({
  urlUtil: {
    getUrlSearchParams: jest.fn().mockImplementation(() => ({ features: [URL_FLAG] })),
  },
}));

interface WrappedProps {
  name: FeatureName;
}

const Wrapped = ({ name }: WrappedProps) => {
  const { isEnabled } = useFeatureFlag(name);
  return (
    <div>
      <h1>A flagged feature</h1>
      {isEnabled ? <div>the feature is enabled</div> : <div>not enabled</div>}
    </div>
  );
};

const renderFeatureFlags = (name: string) => {
  const cast = name as unknown as FeatureName;
  render(
    <FeatureFlagProvider>
      <Wrapped name={cast} />
    </FeatureFlagProvider>
  );
};

test('gets flag values from config', async () => {
  renderFeatureFlags(CONFIG_FLAG);
  const enabled = await screen.findByText('the feature is enabled');
  expect(enabled).toBeInTheDocument();
});

test('disabled for flags that do not exist', async () => {
  renderFeatureFlags('not a real flag');
  const notEnabled = await screen.findByText('not enabled');
  expect(notEnabled).toBeInTheDocument();
});

// broken this somehow -- will look into why later date
test.skip('detects feature flags in url params', async () => {
  renderFeatureFlags(URL_FLAG);
  const enabled = await screen.findByText('the feature is enabled');
  expect(enabled).toBeInTheDocument();
});
