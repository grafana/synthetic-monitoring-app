import { screen } from '@testing-library/react';

import { CheckType, HttpMethod, IpVersion } from 'types';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/v2.utils';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) payload`, () => {
  it(`has the correct default values submitted`, async () => {
    const { read, user } = await renderNewFormV2(checkType);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.ipVersion).toBe(IpVersion.V4);
  });

  it(`can change method to POST`, async () => {
    const METHOD_OPTION = HttpMethod.POST;
    const { read, user } = await renderNewFormV2(checkType);
    await user.click(screen.getByLabelText(/Request method \*/));
    await user.click(screen.getByRole('menuitem', { name: METHOD_OPTION }));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.settings.http.method).toBe(METHOD_OPTION);
  });

  it(`can add request target`, async () => {
    const REQUEST_TARGET = `https://example.com`;

    const { read, user } = await renderNewFormV2(checkType);
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

    const { read, user } = await renderNewFormV2(checkType);

    const targetInput = screen.getByLabelText('Request target', { exact: false });
    await user.type(targetInput, REQUEST_TARGET);

    const queryParamsButton = screen.getByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const queryParam1Key = screen.getByLabelText('Query parameter 1 name');
    const queryParam1Value = screen.getByLabelText('Query parameter 1 value');

    await user.type(queryParam1Key, QUERY_PARAM_KEY_1);
    await user.type(queryParam1Value, QUERY_PARAM_VALUE_1);

    const addQueryParamButton = screen.getByRole('button', { name: /Query parameter/ });
    await user.click(addQueryParamButton);

    const queryParam2Key = screen.getByLabelText('Query parameter 2 name');
    const queryParam2Value = screen.getByLabelText('Query parameter 2 value');

    await user.type(queryParam2Key, QUERY_PARAM_KEY_2);
    await user.type(queryParam2Value, QUERY_PARAM_VALUE_2);

    await fillMandatoryFields({ user, fieldsToOmit: [`target`], checkType });
    await submitForm(user);

    const { body } = await read();
    expect(body.target).toBe(
      `${REQUEST_TARGET}?${QUERY_PARAM_KEY_1}=${QUERY_PARAM_VALUE_1}&${QUERY_PARAM_KEY_2}=${QUERY_PARAM_VALUE_2}`
    );
  });

  // This tests exists to test that we have a placeholder for the moved cache-bust input
  it(`can add a cache busting query parameter (legacy)`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await fillMandatoryFields({ user, checkType });
    await gotoSection(user, FormSectionName.Check); // Redundant?

    const queryParamsButton = screen.getByLabelText('Manage query parameters');
    await user.click(queryParamsButton);

    const movedText = screen.getByText(/Cache busting query parameter/);
    const movedTextParent = movedText.parentElement;
    expect(movedTextParent).toHaveTextContent('It can be found under');
    expect(movedTextParent).toHaveTextContent('Request options');
    expect(movedText).toBeInTheDocument();
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
