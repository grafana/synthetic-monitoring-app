import { screen, waitFor } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/scripted';

const checkType = CheckType.Scripted;

describe(`ScriptedCheck - 1 (Script) UI`, () => {
  // todo: this is proving to be flaky in the CI/CD. Will look into it at a later date and reenable
  it.skip(`will change to the script tab when there is a script error on submission`, async () => {
    const { user } = await renderNewForm(checkType);

    await user.type(screen.getByLabelText('Job name', { exact: false }), `Job`);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), `Instance`);
    await user.clear(screen.getByTestId(`code-editor`));

    await user.click(screen.getByText(`Examples`));
    expect(screen.getByText(`Basic authentication`)).toBeInTheDocument();

    await submitForm(user);
    const err = await screen.findByText(`Script is required.`);
    expect(err).toBeInTheDocument();
  });

  it(`will display an error and focus the script field when it is missing`, async () => {
    const { user } = await renderNewForm(checkType);
    const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
    await user.clear(scriptTextAreaPreSubmit);
    await fillMandatoryFields({ user, fieldsToOmit: [`probes`], checkType });

    await submitForm(user);
    const err = await screen.findByText(`Script is required.`);
    expect(err).toBeInTheDocument();

    const scriptTextAreaPostSubmit = screen.getByTestId(`code-editor`);
    await waitFor(() => expect(scriptTextAreaPostSubmit).toHaveFocus());
  });
});
