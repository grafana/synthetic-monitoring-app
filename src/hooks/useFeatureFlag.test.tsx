import React from 'react';
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';
import { render, screen } from '@testing-library/react';
import { SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';
import { getTestFlagValues } from 'test/openFeatureTestProvider';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { useFeatureFlag } from './useFeatureFlag';

const OPEN_FEATURE_ROUTED_FLAG = FeatureName.__Turnoff;
const OPEN_FEATURE_KEY = 'synthetic-monitoring.test-only';

jest.mock('services/featureFlags', () => ({
  ...jest.requireActual('services/featureFlags'),
  OPEN_FEATURE_KEYS: {
    'test-only-do-not-use': 'synthetic-monitoring.test-only',
  },
}));

interface WrappedProps {
  name: FeatureName;
}

const Wrapped = ({ name }: WrappedProps) => {
  const { isEnabled, isReady } = useFeatureFlag(name);
  return (
    <div>
      <div>{isEnabled ? 'the feature is enabled' : 'not enabled'}</div>
      <div>{isReady ? 'ready' : 'not ready'}</div>
    </div>
  );
};

const renderFeatureFlag = (
  name: FeatureName,
  flagValueMap: Record<string, boolean> = getTestFlagValues(),
  { delayMs }: { delayMs?: number } = {}
) => {
  return render(
    <OpenFeatureTestProvider domain={SM_OPEN_FEATURE_DOMAIN} flagValueMap={flagValueMap} delayMs={delayMs}>
      <FeatureFlagProvider>
        <Wrapped name={name} />
      </FeatureFlagProvider>
    </OpenFeatureTestProvider>
  );
};

const setUrlFeatures = (...features: string[]) => {
  const search = features.map((feature) => `features=${encodeURIComponent(feature)}`).join('&');
  window.history.replaceState({}, '', `/a/grafana-synthetic-monitoring-app/checks${search ? `?${search}` : ''}`);
};

describe('legacy flags (not mapped in OPEN_FEATURE_KEYS)', () => {
  test('gets flag values from config.featureToggles', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: true });
    renderFeatureFlag(FeatureName.Folders);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('disabled for flags that do not exist', async () => {
    renderFeatureFlag('not a real flag' as FeatureName);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('is always ready (resolves synchronously)', async () => {
    renderFeatureFlag(FeatureName.Folders);
    expect(await screen.findByText('ready')).toBeInTheDocument();
  });
});

describe('OpenFeature-routed flags (mapped in OPEN_FEATURE_KEYS)', () => {
  test('reads the flag value from OpenFeature', async () => {
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: true });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('defaults to disabled when the flag is not set in OpenFeature', async () => {
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('ignores legacy config.featureToggles for mapped flags', async () => {
    // legacy enabled, OpenFeature unset -> mapped flag must follow OpenFeature
    const runtime = require('@grafana/runtime');
    jest.replaceProperty(runtime, 'config', {
      ...runtime.config,
      featureToggles: {
        ...runtime.config.featureToggles,
        [OPEN_FEATURE_ROUTED_FLAG]: true,
      },
    });

    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('mockFeatureToggles drives the OpenFeature backend for mapped flags', async () => {
    mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('reports ready once the provider settles', async () => {
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: true });
    expect(await screen.findByText('ready')).toBeInTheDocument();
  });
});

describe('?features= URL override', () => {
  afterEach(() => setUrlFeatures());

  test('enables a legacy flag by its FeatureName', async () => {
    setUrlFeatures(FeatureName.Folders);
    renderFeatureFlag(FeatureName.Folders);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('enables an OpenFeature-routed flag by its FeatureName, even when OpenFeature says off', async () => {
    setUrlFeatures(OPEN_FEATURE_ROUTED_FLAG);
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('enables an OpenFeature-routed flag by its OpenFeature key', async () => {
    setUrlFeatures(OPEN_FEATURE_KEY);
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('is ready immediately, without waiting for the provider', async () => {
    setUrlFeatures(OPEN_FEATURE_ROUTED_FLAG);
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false }, { delayMs: 60_000 });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
  });

  test('ignores names that do not match the flag', async () => {
    setUrlFeatures(FeatureName.Folders, 'synthetic-monitoring.something-else');
    renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });
});
