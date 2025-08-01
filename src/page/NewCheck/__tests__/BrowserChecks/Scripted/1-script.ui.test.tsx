import { screen } from '@testing-library/react';

import { CheckType } from 'types';
import { renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';
import { fillMandatoryFields } from 'page/__testHelpers__/scripted';

const checkType = CheckType.Browser;

const browserImport = `import { browser } from 'k6/browser';`;
const exportOptions = `export const options = { };`;
const exportCorrectOptions = `export const options = { 
   scenarios: {
    ui: {
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
};`;

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
      await user.type(scriptTextAreaPreSubmit, exportCorrectOptions);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText("Script must import { browser } from 'k6/browser'");
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it does not export options`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);
      await user.type(scriptTextAreaPreSubmit, browserImport);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText('Script does not export any options.');
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it does NOT set the browser type to 'chromium'`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);
      await user.type(scriptTextAreaPreSubmit, browserImport + exportOptions);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText('Script must set the type to chromium in the browser options.');
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it defines a duration prop`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);

      const invalidDurationOptions = `export const options = { 
        scenarios: {
          ui: {
            duration: '1m',
            options: {
              browser: {
                type: 'chromium',
              },
            },
          },
        },
      };`;
      await user.type(scriptTextAreaPreSubmit, browserImport + invalidDurationOptions);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText("Script can't define a duration value for this check");
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it defines vus > 1`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);

      const invalidVusOptions = `export const options = { 
        scenarios: {
          ui: {
            vus: 2,
            options: {
              browser: {
                type: 'chromium',
              },
            },
          },
        },
      };`;
      await user.type(scriptTextAreaPreSubmit, browserImport + invalidVusOptions);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText("Script can't define vus > 1 for this check");
      expect(err).toBeInTheDocument();
    });

    it(`will display an error when it defines iterations > 1`, async () => {
      const { user } = await renderNewForm(checkType);
      const scriptTextAreaPreSubmit = screen.getByTestId(`code-editor`);
      await user.clear(scriptTextAreaPreSubmit);

      const invalidIterationsOptions = `export const options = { 
        scenarios: {
          ui: {
            iterations: 2,
            options: {
              browser: {
                type: 'chromium',
              },
            },
          },
        },
      };`;
      await user.type(scriptTextAreaPreSubmit, browserImport + invalidIterationsOptions);
      
      await fillMandatoryFields({ user, fieldsToOmit: [], checkType });

      await submitForm(user);
      const err = await screen.findByText("Script can't define iterations > 1 for this check");
      expect(err).toBeInTheDocument();
    });
  });
});
