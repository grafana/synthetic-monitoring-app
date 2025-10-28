import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../../../__testHelpers__/v2.utils';

const checkType = CheckType.Traceroute;

describe(`TracerouteCheck - Section 1 (Request) UI`, () => {
  it(`will navigate to the first section and open the request to reveal a nested error`, async () => {
    const { user } = await renderNewFormV2(checkType);
    await user.click(screen.getByText('Request options'));

    const unknownHopsInputPreSubmit = screen.getByLabelText('Max unknown hops', { exact: false });
    await user.clear(unknownHopsInputPreSubmit);

    await fillMandatoryFields({ user, checkType });
    await submitForm(user);

    const err = await screen.findByText(`Must be a number (0-20)`);
    expect(err).toBeInTheDocument();
  });
});
