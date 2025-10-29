import { screen, waitFor } from '@testing-library/react';

import { FormSectionName } from '../../../../../../components/Checkster/types';
import { CheckType } from 'types';
import { renderNewFormV2 } from 'page/__testHelpers__/checkForm';

import { gotoSection, submitForm } from '../../../../../../components/Checkster/__testHelpers__/formHelpers';
import {
  doAdhocCheck,
  getAdhocCheckTestButton,
} from '../../../../../../components/Checkster/feature/adhoc-check/__testHelpers__/adhocCheck';

const checkType = CheckType.DNS;

describe(`DNSCheck - Section 5 (Execution) UI`, () => {
  it(`validates the form and goes to the first error when clicking submit`, async () => {
    const { user } = await renderNewFormV2(checkType);

    await gotoSection(user, FormSectionName.Labels);
    const addLabelButton = screen.getByRole('button', { name: /Label/ });
    await user.click(addLabelButton);
    await submitForm(user);
    expect(screen.getByText(`Job name is required`)).toBeInTheDocument();
  });

  it(`displays the test button`, async () => {
    await renderNewFormV2(checkType);
    const adhocCheckButton = getAdhocCheckTestButton();
    expect(adhocCheckButton).toBeInTheDocument();
  });

  it(`validates the form and goes to the first error when clicking test`, async () => {
    const { user } = await renderNewFormV2(checkType);

    await gotoSection(user, FormSectionName.Alerting);
    await doAdhocCheck(user);
    await waitFor(() => expect(screen.getByText(`Job name is required`)).toBeInTheDocument());
  });
});
