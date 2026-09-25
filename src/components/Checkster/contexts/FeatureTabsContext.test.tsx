import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';
import { createWrapper } from 'test/render';
import { mockFeatureToggles } from 'test/utils';

import { CheckType, FeatureName } from 'types';

import { useChecksterContext } from './ChecksterContext';
import { FeatureTabsContextProvider, useFeatureTabsContext } from './FeatureTabsContext';

jest.mock('./ChecksterContext', () => ({
  useChecksterContext: jest.fn(),
}));

const mockUseChecksterContext = useChecksterContext as jest.Mock;

function ProvidersWrapper({ children }: PropsWithChildren) {
  return <FeatureTabsContextProvider>{children}</FeatureTabsContextProvider>;
}

function setup(checkType: CheckType) {
  mockUseChecksterContext.mockReturnValue({ checkType });
  const { Wrapper } = createWrapper({ wrapper: ProvidersWrapper });

  return renderHook(() => useFeatureTabsContext(), { wrapper: Wrapper });
}

function hasSecretsTab(result: ReturnType<typeof setup>['result']) {
  return result.current.tabs.some(([label]) => label === 'Secrets');
}

describe('FeatureTabsContext secrets tab', () => {
  describe('when the SecretsManagement feature flag is enabled', () => {
    beforeEach(() => {
      mockFeatureToggles({ [FeatureName.SecretsManagement]: true });
    });

    it.each([CheckType.Http, CheckType.Browser, CheckType.Scripted])(
      'shows the Secrets tab for %s checks',
      (checkType) => {
        const { result } = setup(checkType);
        expect(hasSecretsTab(result)).toBe(true);
      }
    );

    it.each([CheckType.Dns, CheckType.Grpc, CheckType.MultiHttp, CheckType.Ping, CheckType.Tcp, CheckType.Traceroute])(
      'hides the Secrets tab for incompatible %s checks',
      (checkType) => {
        const { result } = setup(checkType);
        expect(hasSecretsTab(result)).toBe(false);
      }
    );
  });

  describe('when the SecretsManagement feature flag is disabled', () => {
    it.each([CheckType.Http, CheckType.Browser, CheckType.Scripted])(
      'hides the Secrets tab for %s checks even though the check type is compatible',
      (checkType) => {
        const { result } = setup(checkType);
        expect(hasSecretsTab(result)).toBe(false);
      }
    );
  });
});
