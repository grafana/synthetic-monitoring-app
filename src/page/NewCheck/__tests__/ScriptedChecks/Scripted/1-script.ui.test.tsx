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

  it(`will display an error when script contains a k6 version pragma`, async () => {
    const { user } = await renderNewForm(checkType);
    const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
    await user.clear(scriptTextAreaPreSubmit);

    const scriptWithPragma = `'use k6 > 0.52'
import http from 'k6/http';
export default function() {
  http.get('https://example.com');
}`;
    await user.type(scriptTextAreaPreSubmit, scriptWithPragma);
    await fillMandatoryFields({ user, fieldsToOmit: [`probes`], checkType });

    await submitForm(user);
    const err = await screen.findByText('Script contains a k6 version pragma which is not allowed. Please remove the "use k6" directive.');
    expect(err).toBeInTheDocument();
  });

  it(`will display an error when script imports k6 extensions`, async () => {
    const { user } = await renderNewForm(checkType);
    const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
    await user.clear(scriptTextAreaPreSubmit);

    const scriptWithExtension = `import { Faker } from "k6/x/faker";
import http from 'k6/http';
export default function() {
  http.get('https://example.com');
}`;
    await user.type(scriptTextAreaPreSubmit, scriptWithExtension);
    await fillMandatoryFields({ user, fieldsToOmit: [`probes`], checkType });

    await submitForm(user);
    const err = await screen.findByText('Script imports k6 extensions which are not allowed. Please remove imports from k6/x/ paths.');
    expect(err).toBeInTheDocument();
  });

  it(`will display an error when script contains browser import (not allowed for scripted checks)`, async () => {
    const { user } = await renderNewForm(checkType);
    const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
    await user.clear(scriptTextAreaPreSubmit);

    const scriptWithBrowser = `import { browser } from 'k6/browser';
import http from 'k6/http';
export default function() {
  http.get('https://example.com');
}`;
    await user.type(scriptTextAreaPreSubmit, scriptWithBrowser);
    await fillMandatoryFields({ user, fieldsToOmit: [`probes`], checkType });

    await submitForm(user);
    const err = await screen.findByText("Script must not import { browser } from 'k6/browser'");
    expect(err).toBeInTheDocument();
  });
});
