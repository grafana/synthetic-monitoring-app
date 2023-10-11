import React, { type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { AppPluginMeta, DataSourceSettings } from '@grafana/data';
import userEventLib from '@testing-library/user-event';

import { GlobalSettings, GrafanaInstances } from 'types';
import { InstanceContext } from 'contexts/InstanceContext';
import { getInstanceMock, instanceSettings } from 'datasource/__mocks__/DataSource';

export const createInstance = (options?: GrafanaInstances) => {
  return {
    api: getInstanceMock(instanceSettings),
    alertRuler: {} as DataSourceSettings,
    metrics: {} as DataSourceSettings,
    logs: {} as DataSourceSettings,
    ...options,
  };
};

export const createWrapper = ({ instance = createInstance() }: { instance?: GrafanaInstances } = {}) => {
  const meta = {} as AppPluginMeta<GlobalSettings>;

  // eslint-disable-next-line react/display-name
  return ({ children }: { children: ReactNode }) => (
    <InstanceContext.Provider value={{ instance, loading: false, meta }}>{children}</InstanceContext.Provider>
  );
};

type CustomRenderOptions = Omit<RenderOptions, 'wrapper'> & {
  instance?: GrafanaInstances;
};

const customRender = (ui: ReactElement, options: CustomRenderOptions = {}) => {
  const { instance: instanceOptions, ...rest } = options;
  const instance = createInstance(instanceOptions);
  const user = userEventLib.setup();

  return {
    user,
    instance,
    history,
    ...render(ui, {
      wrapper: createWrapper({ instance }),
      ...rest,
    }),
  };
};

export { customRender as render };
