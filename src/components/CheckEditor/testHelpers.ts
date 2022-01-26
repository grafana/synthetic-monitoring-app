import { screen, waitFor, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CheckType } from 'types';

export const selectCheckType = async (checkType: CheckType) => {
  const checkTypeInput = await screen.findByText('PING');
  userEvent.click(checkTypeInput);
  const selectMenus = await screen.findAllByTestId('select');
  userEvent.selectOptions(selectMenus[0], checkType);
  await screen.findByText(checkType.toUpperCase());
};

export const toggleSection = async (sectionName: string): Promise<HTMLElement> => {
  const sectionHeader = await screen.findByText(sectionName);
  userEvent.click(sectionHeader);
  return sectionHeader.parentElement?.parentElement ?? new HTMLElement();
};

export const submitForm = async (onReturn: (arg0: Boolean) => void) => {
  const saveButton = await screen.findByRole('button', { name: 'Save' });
  expect(saveButton).not.toBeDisabled();
  await act(async () => await userEvent.click(saveButton));
  // await waitFor(() => expect(onReturn).toHaveBeenCalledWith(true));
};

export const getSlider = async (formName: string) => {
  const container = await screen.findByTestId(formName);
  const input = (await within(container).findByRole('textbox')) as HTMLInputElement;
  return input;
};

export const BASIC_HTTP_CHECK = {
  job: 'testJob',
  target: 'https://grafana.com',
  enabled: true,
  labels: [],
  probes: [42],
  timeout: 2000,
  frequency: 120000,
  alertSensitivity: 'none',
  settings: {
    http: {
      method: 'GET',
      ipVersion: 'V4',
      noFollowRedirects: false,
      validStatusCodes: [],
      validHTTPVersions: [],
      headers: [],
      body: '',
      proxyURL: '',
      cacheBustingQueryParamName: '',
      failIfNotSSL: false,
      failIfSSL: false,
      failIfBodyMatchesRegexp: [],
      failIfBodyNotMatchesRegexp: [],
      failIfHeaderMatchesRegexp: [],
      failIfHeaderNotMatchesRegexp: [],
      tlsConfig: {
        clientCert: '',
        caCert: '',
        clientKey: '',
        insecureSkipVerify: false,
        serverName: '',
      },
    },
  },
  basicMetricsOnly: true,
};
