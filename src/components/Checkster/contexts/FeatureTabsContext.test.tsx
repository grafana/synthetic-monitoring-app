import React, { PropsWithChildren } from 'react';
import { renderHook } from '@testing-library/react';

import { CheckType, FeatureName } from 'types';
import { isFeatureEnabled } from 'contexts/FeatureFlagContext';

import { useChecksterContext } from './ChecksterContext';
import { FeatureTabsContextProvider, useFeatureTabsContext } from './FeatureTabsContext';

jest.mock('contexts/FeatureFlagContext', () => ({
  isFeatureEnabled: jest.fn(),
}));

jest.mock('./ChecksterContext', () => ({
  useChecksterContext: jest.fn(),
}));

const mockIsFeatureEnabled = isFeatureEnabled as jest.Mock;
const mockUseChecksterContext = useChecksterContext as jest.Mock;

function setup(checkType: CheckType) {
  mockUseChecksterContext.mockReturnValue({ checkType });

  const wrapper = ({ children }: PropsWithChildren) => (
    <FeatureTabsContextProvider>{children}</FeatureTabsContextProvider>
  );

  return renderHook(() => useFeatureTabsContext(), { wrapper });
}

function hasSecretsTab(result: ReturnType<typeof setup>['result']) {
  return result.current.tabs.some(([label]) => label === 'Secrets');
}

describe('FeatureTabsContext secrets tab', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('when the SecretsManagement feature flag is enabled', () => {
    beforeEach(() => {
      mockIsFeatureEnabled.mockImplementation((name: FeatureName) => name === FeatureName.SecretsManagement);
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
    beforeEach(() => {
      mockIsFeatureEnabled.mockReturnValue(false);
    });

    it.each([CheckType.Http, CheckType.Browser, CheckType.Scripted])(
      'hides the Secrets tab for %s checks even though the check type is compatible',
      (checkType) => {
        const { result } = setup(checkType);
        expect(hasSecretsTab(result)).toBe(false);
      }
    );
  });
});
