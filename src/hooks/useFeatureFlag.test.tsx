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

import { useFeatureFlag, useIsFeatureEnabled } from './useFeatureFlag';

const FLAG = FeatureName.__Turnoff;

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

const renderWithProvider = (ui: ReactElement, flagValueMap: Record<string, boolean> = getTestFlagValues()) =>
  render(
    <OpenFeatureTestProvider domain={SM_OPEN_FEATURE_DOMAIN} flagValueMap={flagValueMap}>
      {ui}
    </OpenFeatureTestProvider>
  );

const renderFeatureFlag = (name: FeatureName, flagValueMap?: Record<string, boolean>) =>
  renderWithProvider(<Wrapped name={name} />, flagValueMap);

const renderIsFeatureEnabled = (name: FeatureName, flagValueMap?: Record<string, boolean>) =>
  renderWithProvider(<WrappedResolver name={name} />, flagValueMap);

// Resolves every flag to `true` until `loseFlags()`, after which it reports FLAG_NOT_FOUND and
// emits Error, like a provider whose backend has gone away.
function createFailingProvider() {
  let lost = false;
  const events = new OpenFeatureEventEmitter();
  const provider: Partial<Provider> = {
    events,
    resolveBooleanEvaluation: (_key, defaultValue) =>
      lost
        ? { value: defaultValue, reason: StandardResolutionReasons.ERROR, errorCode: ErrorCode.FLAG_NOT_FOUND }
        : { value: true, reason: StandardResolutionReasons.STATIC },
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
      {ui}
    </OpenFeatureTestProvider>
  );

  return failing;
};

describe('useFeatureFlag', () => {
  test('reads the flag value from OpenFeature', async () => {
    renderFeatureFlag(FLAG, { [FLAG]: true });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('is disabled when OpenFeature has no definition for the flag', async () => {
    renderFeatureFlag(FLAG, {});
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('is disabled for flags that do not exist', async () => {
    renderFeatureFlag('not a real flag' as FeatureName);
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('mockFeatureToggles drives the flag value', async () => {
    mockFeatureToggles({ [FLAG]: true });
    renderFeatureFlag(FLAG);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('reports ready once the provider settles', async () => {
    renderFeatureFlag(FLAG, { [FLAG]: true });
    expect(await screen.findByText('ready')).toBeInTheDocument();
  });

  test('falls back to disabled once the provider stops resolving the flag', async () => {
    const { loseFlags } = renderWithFailingProvider(<Wrapped name={FLAG} />);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();

    await act(async () => loseFlags());

    expect(await screen.findByText('not enabled')).toBeInTheDocument();
    expect(screen.getByText('ready')).toBeInTheDocument();
  });
});

describe('useIsFeatureEnabled', () => {
  test('reads flag values from OpenFeature', async () => {
    renderIsFeatureEnabled(FLAG, { [FLAG]: true });
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('is disabled when OpenFeature has no definition for the flag', async () => {
    renderIsFeatureEnabled(FLAG, {});
    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });

  test('re-evaluates when the OpenFeature configuration changes', async () => {
    renderIsFeatureEnabled(FLAG, { [FLAG]: false });
    expect(await screen.findByText('not enabled')).toBeInTheDocument();

    // OpenFeatureTestProvider wraps an unexported TypedInMemoryProvider; putConfiguration is
    // the only way to emit ConfigurationChanged through the shared harness.
    const provider = OpenFeature.getProvider(SM_OPEN_FEATURE_DOMAIN) as TypedInMemoryProvider;
    await act(() =>
      provider.putConfiguration({
        [FLAG]: { variants: { on: true }, defaultVariant: 'on', disabled: false },
      })
    );

    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();
  });

  test('falls back to disabled once the provider stops resolving the flag', async () => {
    const { loseFlags } = renderWithFailingProvider(<WrappedResolver name={FLAG} />);
    expect(await screen.findByText('the feature is enabled')).toBeInTheDocument();

    await act(async () => loseFlags());

    expect(await screen.findByText('not enabled')).toBeInTheDocument();
  });
});
