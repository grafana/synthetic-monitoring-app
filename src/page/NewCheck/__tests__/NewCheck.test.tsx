import { screen, waitFor } from '@testing-library/react';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { runTestWithoutLogsAccess } from 'test/utils';

import { CheckType } from 'types';
import { fillMandatoryFields } from 'page/__testHelpers__/apiEndPoint';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

describe(`<NewCheck />`, () => {
  it(`should show an error message when it fails to save a check`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);
    server.use(
      apiRoute(`addCheck`, {
        result: () => {
          return {
            status: 500,
          };
        },
      })
    );

    await fillMandatoryFields({ user, checkType: CheckType.HTTP });
    await submitForm(user);

    expect(screen.getByText(/Save failed/)).toBeInTheDocument();
  });

  it(`should show the check limit warning when the check limit is reached`, async () => {
    server.use(
      apiRoute('getTenantLimits', {
        result: () => {
          return {
            json: {
              MaxChecks: 1,
              MaxScriptedChecks: 10,
              MaxMetricLabels: 16,
              MaxLogLabels: 13,
              maxAllowedMetricLabels: 10,
              maxAllowedLogLabels: 5,
            },
          };
        },
      })
    );

    await renderNewForm(CheckType.HTTP);
    expect(await screen.findByText(/You have reached the limit of checks you can create./)).toBeInTheDocument();
  });

  it(`should disable the form when the check limit is reached`, async () => {
    server.use(
      apiRoute('getTenantLimits', {
        result: () => {
          return {
            json: {
              MaxChecks: 1,
              MaxScriptedChecks: 10,
              MaxMetricLabels: 16,
              MaxLogLabels: 13,
              maxAllowedMetricLabels: 10,
              maxAllowedLogLabels: 5,
            },
          };
        },
      })
    );

    await renderNewForm(CheckType.HTTP);
    expect(screen.getByRole(`button`, { name: /Submit/ })).toBeDisabled();
  });

  it(`should NOT disable the form when the check limit can't be fetched`, async () => {
    server.use(
      apiRoute('getTenantLimits', {
        result: () => {
          return {
            status: 500,
          };
        },
      })
    );

    await renderNewForm(CheckType.HTTP);
    expect(screen.getByRole(`button`, { name: /Submit/ })).toBeEnabled();
  });

  it(`should focus the probes select correctly when appropriate`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['probes'] });
    await submitForm(user);

    const probesSelect = await screen.findByLabelText(/Probe locations/);
    await waitFor(() => expect(probesSelect).toHaveFocus());
  });

  it(`should display an error message when the job name contains commas`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `job name with, comma`);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const jobNameField = await screen.findByLabelText(/Job name/);
    await waitFor(() => expect(jobNameField).toHaveFocus());

    expect(screen.getByText(/Job names can't contain commas or quotes/)).toBeInTheDocument();
  });

  it(`should display an error message when the job name contains single quotes`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `job name with ' single quote`);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const jobNameField = await screen.findByLabelText(/Job name/);
    await waitFor(() => expect(jobNameField).toHaveFocus());

    expect(screen.getByText(/Job names can't contain commas or quotes/)).toBeInTheDocument();
  });

  it(`should display an error message when the job name contains double quotes`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `job name with " double quote`);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const jobNameField = await screen.findByLabelText(/Job name/);
    await waitFor(() => expect(jobNameField).toHaveFocus());

    expect(screen.getByText(/Job names can't contain commas or quotes/)).toBeInTheDocument();
  });

  it(`trims white spaces from job name`, async () => {
    const { read, user } = await renderNewForm(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `   my job name   `);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const { body } = await read();
    expect(body.job).toBe('my job name');
  });

  it(`should disable the test button when the user doesn't have logs access`, async () => {
    runTestWithoutLogsAccess();
    const { user } = await renderNewForm(CheckType.HTTP);
    await goToSection(user, 5);

    const testButton = screen.getByRole(`button`, { name: /Test/ });
    expect(testButton).toBeDisabled();
  });

  // jsdom doesn't give us back the submitter of the form, so we can't test this
  // https://github.com/jsdom/jsdom/issues/3117
  it.skip(`should show an error message when it fails to test a check`, async () => {});
});
