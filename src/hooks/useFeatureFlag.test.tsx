import React, { ReactElement } from 'react';
import { OpenFeatureTestProvider } from '@openfeature/react-sdk';
import {
  ErrorCode,
  OpenFeature,
  OpenFeatureEventEmitter,
  type Provider,
  ProviderEvents,
  StandardResolutionReasons,
  TypedInMemoryProvider,
} from '@openfeature/web-sdk';
import { act, render, screen } from '@testing-library/react';
import { SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';
import { getTestFlagValues } from 'test/openFeatureTestProvider';
import { mockFeatureToggles } from 'test/utils';

import { FeatureName } from 'types';
import { FeatureFlagProvider } from 'components/FeatureFlagProvider';

import { useFeatureFlag, useIsFeatureEnabled } from './useFeatureFlag';

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

const WrappedResolver = ({ name }: WrappedProps) => {
  const isFeatureEnabled = useIsFeatureEnabled();
  return <div>{isFeatureEnabled(name) ? 'the feature is enabled' : 'not enabled'}</div>;
};

const renderWithProviders = (ui: ReactElement, flagValueMap: Record<string, boolean> = getTestFlagValues()) => {
  return render(
    <OpenFeatureTestProvider domain={SM_OPEN_FEATURE_DOMAIN} flagValueMap={flagValueMap}>
      <FeatureFlagProvider>{ui}</FeatureFlagProvider>
    </OpenFeatureTestProvider>
  );
};

const renderFeatureFlag = (name: FeatureName, flagValueMap?: Record<string, boolean>) =>
  renderWithProviders(<Wrapped name={name} />, flagValueMap);

const renderIsFeatureEnabled = (name: FeatureName, flagValueMap?: Record<string, boolean>) =>
  renderWithProviders(<WrappedResolver name={name} />, flagValueMap);

// Resolves every flag to `false` until `loseFlags()`, after which it reports FLAG_NOT_FOUND and
// emits Error, like a provider whose backend has gone away.
function createFailingProvider() {
  let lost = false;
  const events = new OpenFeatureEventEmitter();
  const provider: Partial<Provider> = {
    events,
    resolveBooleanEvaluation: (_key, defaultValue) =>
      lost
        ? { value: defaultValue, reason: StandardResolutionReasons.ERROR, errorCode: ErrorCode.FLAG_NOT_FOUND }
        : { value: false, reason: StandardResolutionReasons.STATIC },
  };

  return {
    provider,
    loseFlags: () => {
      lost = true;
      events.emit(ProviderEvents.Error);
    },
  };
}

const renderWithFailingProvider = (ui: ReactElement) => {
  const failing = createFailingProvider();
  render(
    <OpenFeatureTestProvider domain={SM_OPEN_FEATURE_DOMAIN} provider={failing.provider}>
      <FeatureFlagProvider>{ui}</FeatureFlagProvider>
    </OpenFeatureTestProvider>
  );

  return failing;
};

describe('useFeatureFlag', () => {
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

    test('defaults to disabled when the flag is set nowhere', async () => {
      renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG);
      expect(await screen.findByText('not enabled')).toBeInTheDocument();
    });

    test('ignores legacy config.featureToggles when OpenFeature resolves the flag', async () => {
      mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
      renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false });
      expect(await screen.findByText('not enabled')).toBeInTheDocument();
    });

    test('falls back to legacy config.featureToggles when OpenFeature has no definition', async () => {
      mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
      renderFeatureFlag(OPEN_FEATURE_ROUTED_FLAG, {});
      expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
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

    test('falls back to legacy once the provider stops resolving the flag', async () => {
      mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
      const { loseFlags } = renderWithFailingProvider(<Wrapped name={OPEN_FEATURE_ROUTED_FLAG} />);
      expect(await screen.findByText('not enabled')).toBeInTheDocument();

      await act(async () => loseFlags());

      expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
    });
  });
});

describe('useIsFeatureEnabled', () => {
  test('gets legacy flag values from config.featureToggles', async () => {
    mockFeatureToggles({ [FeatureName.Folders]: true });
    renderIsFeatureEnabled(FeatureName.Folders);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('reads mapped flag values from OpenFeature', async () => {
    renderIsFeatureEnabled(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: true });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('ignores legacy config.featureToggles when OpenFeature resolves the flag', async () => {
    mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
    renderIsFeatureEnabled(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false });
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('falls back to legacy config.featureToggles when OpenFeature has no definition', async () => {
    mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
    renderIsFeatureEnabled(OPEN_FEATURE_ROUTED_FLAG, {});
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('re-evaluates when the OpenFeature configuration changes', async () => {
    renderIsFeatureEnabled(OPEN_FEATURE_ROUTED_FLAG, { [OPEN_FEATURE_KEY]: false });
    expect(await screen.findByText('not enabled')).toBeInTheDocument();

    // OpenFeatureTestProvider wraps an unexported TypedInMemoryProvider; putConfiguration is
    // the only way to emit ConfigurationChanged through the shared harness.
    const provider = OpenFeature.getProvider(SM_OPEN_FEATURE_DOMAIN) as TypedInMemoryProvider;
    await act(() =>
      provider.putConfiguration({
        [OPEN_FEATURE_KEY]: { variants: { on: true }, defaultVariant: 'on', disabled: false },
      })
    );

    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('falls back to legacy once the provider stops resolving the flag', async () => {
    mockFeatureToggles({ [OPEN_FEATURE_ROUTED_FLAG]: true });
    const { loseFlags } = renderWithFailingProvider(<WrappedResolver name={OPEN_FEATURE_ROUTED_FLAG} />);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();

    await act(async () => loseFlags());

    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });
});
