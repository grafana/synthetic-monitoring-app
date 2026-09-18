import { ClientProviderEvents, OpenFeature, TypedInMemoryProvider } from '@openfeature/web-sdk';

const FLAG = 'synthetic-monitoring.check-suggestions';
const flagConfig = (value: boolean) => ({
  [FLAG]: { variants: { value }, defaultVariant: 'value' as const, disabled: false },
});

describe('Feature control overrides', () => {
  let localProvider: TypedInMemoryProvider;
  let remoteProvider: TypedInMemoryProvider;
  let sdk: typeof OpenFeature;
  let service: typeof import('./featureFlags');

  async function initialize(withOverrides = true) {
    jest.resetModules();
    const { TypedInMemoryProvider, OpenFeature } = await import('@openfeature/web-sdk');
    sdk = OpenFeature;
    localProvider = new TypedInMemoryProvider({});
    remoteProvider = new TypedInMemoryProvider(flagConfig(false));
    jest.doMock('@grafana/runtime', () => ({
      config: { appSubUrl: '', namespace: 'test-stack' },
      ...(withOverrides ? { createOpenFeatureLocalStorageProvider: () => localProvider } : {}),
    }));
    jest.doMock('@openfeature/ofrep-web-provider', () => ({
      OFREPWebProvider: jest.fn(() => remoteProvider),
    }));
    service = await import('./featureFlags');
    await service.initOpenFeature();
  }

  afterEach(async () => {
    await sdk?.clearProviders();
  });

  it.each([true, false])('honors a local %s override over the opposite server value', async (value) => {
    await initialize();
    await remoteProvider.putConfiguration(flagConfig(!value));
    await localProvider.putConfiguration(flagConfig(value));

    expect(service.getBooleanFlag(FLAG, !value)).toBe(value);
  });

  it('uses the server value when no override exists', async () => {
    await initialize();
    await remoteProvider.putConfiguration(flagConfig(true));

    expect(service.getBooleanFlag(FLAG)).toBe(true);
  });

  it('returns to the server value when an override is removed', async () => {
    await initialize();
    await localProvider.putConfiguration(flagConfig(true));
    expect(service.getBooleanFlag(FLAG)).toBe(true);

    await localProvider.putConfiguration({});
    expect(service.getBooleanFlag(FLAG)).toBe(false);
  });

  it('notifies plugin consumers when an override changes', async () => {
    await initialize();
    const changed = jest.fn();
    sdk.getClient(service.SM_OPEN_FEATURE_DOMAIN).addHandler(ClientProviderEvents.ConfigurationChanged, changed);

    await localProvider.putConfiguration(flagConfig(true));

    expect(changed).toHaveBeenCalled();
    expect(service.getBooleanFlag(FLAG)).toBe(true);
  });

  it('keeps server evaluation working on hosts without the override helper', async () => {
    await initialize(false);
    await remoteProvider.putConfiguration(flagConfig(true));

    expect(service.getBooleanFlag(FLAG)).toBe(true);
  });

  it('uses the caller default for an unknown flag', async () => {
    await initialize();

    expect(service.getBooleanFlag('unknown', true)).toBe(true);
    expect(service.getBooleanFlag('unknown', false)).toBe(false);
  });
});
