import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

const checkType = CheckType.Browser;

describe(`BrowserCheck - 1 (Script) UI`, () => {
  describe('will validate the script', () => {
    it(`will display an error when the script is missing`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);

      await submitForm(user);
      const err = await screen.findByText(`Script is required.`);
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it does not import the browser module`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);
      await user.type(
        scriptTextAreaPreSubmit,
        "import {\\{} check {\\}} from 'k6'; export const options = {\\{}{\\}};"
      );

      await submitForm(user);
      const err = await screen.findByText("Script must import { browser } from 'k6/browser'");
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it does not export options`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);
      await user.type(scriptTextAreaPreSubmit, "import {\\{} check {\\}} from 'k6';");

      await submitForm(user);
      const err = await screen.findByText('Script does not export any options.');
      expect(err).toBeInTheDocument();
    });
  });
});
