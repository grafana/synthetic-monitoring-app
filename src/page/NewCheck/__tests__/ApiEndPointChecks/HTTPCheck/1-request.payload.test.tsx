import { screen } from '@testing-library/react';
import { selectOption } from 'test/utils';

import { CheckType, HttpMethod, IpVersion } from 'types';
import { goToSectionV2, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

import { FormStepOrder } from '../../../../../components/CheckForm/constants';
import { fillMandatoryFields } from '../../../../__testHelpers__/apiEndPoint';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewForm(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.ipVersion).toBe(IpVersion.V4);
  });

  it(`can change method to POST`, async () => {
    const METHOD_OPTION = HttpMethod.POST;
    const { read, user } = await renderNewForm(checkType);
    await selectOption(user, { label: 'Request method', option: METHOD_OPTION });

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.method).toBe(METHOD_OPTION);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `https://example.com`;

    const { read, user } = await renderNewForm(checkType);
    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(REQUEST_TARGET);
  });

  it(`can add query parameters`, async () => {
    const REQUEST_TARGET = `https://example.com/`;
    const QUERY_PARAM_KEY_1 = `key1`;
    const QUERY_PARAM_VALUE_1 = `value1`;
    const QUERY_PARAM_KEY_2 = `key2`;
    const QUERY_PARAM_VALUE_2 = `value2`;

    const { read, user } = await renderNewForm(checkType);

    const targetInput = await screen.findByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    const queryParamsButton = await screen.findByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const queryParam1Key = await screen.findByLabelText('Query param key 1');
    const queryParam1Value = await screen.findByLabelText('Query param value 1');

    await user.type(queryParam1Key, QUERY_PARAM_KEY_1);
    await user.type(queryParam1Value, QUERY_PARAM_VALUE_1);

    const addQueryParamButton = await screen.findByText('Add query param');
    await user.click(addQueryParamButton);

    const queryParam2Key = await screen.findByLabelText('Query param key 2');
    const queryParam2Value = await screen.findByLabelText('Query param value 2');

    await user.type(queryParam2Key, QUERY_PARAM_KEY_2);
    await user.type(queryParam2Value, QUERY_PARAM_VALUE_2);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(
      `${REQUEST_TARGET}?${QUERY_PARAM_KEY_1}=${QUERY_PARAM_VALUE_1}&${QUERY_PARAM_KEY_2}=${QUERY_PARAM_VALUE_2}`
    );
  });

  it(`can add a cache busting query parameter`, async () => {
    const CACHE_BUSTER_PARAM = `ghost-busting`;

    const { read, user } = await renderNewForm(checkType);
    await fillMandatoryFields({ user, checkType });
    await goToSectionV2(user, FormStepOrder.Check);

    const queryParamsButton = screen.getByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const cacheBustingCheckbox = screen.getByPlaceholderText('cache-bust');
    await user.type(cacheBustingCheckbox, CACHE_BUSTER_PARAM);

    await submitForm(user);
    const { body } = await read();
    expect(body.settings.http.cacheBustingQueryParamName).toBe(CACHE_BUSTER_PARAM);
  });

  // separated to 1-request_options.payload.test.tsx
  // describe(`Request options`, () => {});

  // separated to 1-request_body.payload.test.tsx
  // describe(`Request body`, () => {});

  // separated to 1-request_authentication.payload.test.tsx
  // describe(`Basic auth`, () => {});

  // separated to 1-request_tlsConfig.payload.test.tsx
  // describe(`TLS Config`, () => {});

  // separated to 1-request_proxy.payload.test.tsx
  // describe(`Proxy`, () => {});
});
