import { OpenFeature, TypedInMemoryProvider } from '@openfeature/web-sdk';
import { SM_OPEN_FEATURE_DOMAIN } from 'services/featureFlags';

type InMemoryFlagConfiguration = NonNullable<ConstructorParameters<typeof TypedInMemoryProvider>[0]>;

let flagValues: Record<string, boolean> = {};

// Stands in for the OFREP provider in tests. Registered in jest-setup,
// driven via mockFeatureToggles (or setInMemoryFlag directly).
export const inMemoryProvider = new TypedInMemoryProvider({});

export function registerInMemoryProvider() {
  OpenFeature.setProvider(SM_OPEN_FEATURE_DOMAIN, inMemoryProvider);
}

export function setInMemoryFlag(key: string, value: boolean) {
  flagValues = { ...flagValues, [key]: value };
  void inMemoryProvider.putConfiguration(toConfiguration(flagValues));
}

export function resetInMemoryFlags() {
  if (Object.keys(flagValues).length === 0) {
    return;
  }

  flagValues = {};
  void inMemoryProvider.putConfiguration({});
}

function toConfiguration(values: Record<string, boolean>): InMemoryFlagConfiguration {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      {
        disabled: false,
        defaultVariant: value ? 'on' : 'off',
        variants: { on: true, off: false },
      },
    ])
  );
}
