import { screen, waitFor, within } from '@testing-library/react';
import { getSelect } from 'test/utils';

import { CheckType, HttpMethod } from 'types';
import { fillMandatoryFields } from 'page/__testHelpers__/apiEndPoint';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.HTTP;

describe(`HttpCheck - Section 1 (Request) UI`, () => {
  it(`has HTTP selected in the request type`, async () => {
    await renderNewForm(checkType);

    const requestType = await screen.getByRole('radiogroup');
    expect(within(requestType).getByLabelText('HTTP')).toBeChecked();
  });

  it(`has GET method selected by default in request target`, async () => {
    await renderNewForm(checkType);

    const [methodSelect] = await getSelect({ label: 'Request method' });
    expect(within(methodSelect).getByText(HttpMethod.GET)).toBeInTheDocument();
  });

  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewForm(checkType);
    await user.click(screen.getByText('Request options'));
    await user.click(screen.getByText('Add request header'));

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Request header name is required`);
    expect(err).toBeInTheDocument();

    const requestHeaderName = screen.getByLabelText('Request header 1 name');
    await waitFor(() => expect(requestHeaderName).toHaveFocus());
  });
});
