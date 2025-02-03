import { screen, waitFor } from '@testing-library/react';
import { DataTestIds } from 'test/dataTestIds';
import { PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import { probeToMetadataProbe, runTestAsHGFreeUserOverLimit, runTestWithoutLogsAccess } from 'test/utils';

import { CheckType } from 'types';
import { fillMandatoryFields } from 'page/__testHelpers__/apiEndPoint';
import { goToSection, renderNewForm, submitForm } from 'page/__testHelpers__/checkForm';

describe(`<NewCheck /> journey`, () => {
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
    expect(await screen.findByText(/You have reached your check limit of /)).toBeInTheDocument();
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

    const { container } = await renderNewForm(CheckType.HTTP);
    expect(container.querySelector('#check-editor-job-input')).toBeDisabled();
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

    const { container } = await renderNewForm(CheckType.HTTP);
    expect(container.querySelector('#check-editor-job-input')).not.toBeDisabled();
  });

  it(`should show the mothly execution limit warning when the limit is reached for HG free tier customers`, async () => {
    runTestAsHGFreeUserOverLimit();

    await renderNewForm(CheckType.HTTP);
    expect(await screen.findByText(/You have reached your monthly execution limit of/)).toBeInTheDocument();
  });

  it(`should disable the form when the mothly execution limit is reached for HG free tier customers`, async () => {
    runTestAsHGFreeUserOverLimit();

    await renderNewForm(CheckType.HTTP);
    expect(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).toBeDisabled();
  });

  it(`should focus the probes filter component when appropriate`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['probes'] });
    await submitForm(user);

    const probesFilter = await screen.findByLabelText(/Probe locations/);
    await waitFor(() => expect(probesFilter).toHaveFocus());
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

  it(`disables the submit button by default`, async () => {
    await renderNewForm(CheckType.HTTP);
    expect(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).not.toBeEnabled();
  });

  it(`enables the submit button when a field is edited`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);
    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, 'My Job Name');
    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    expect(submitButton).toBeEnabled();
  });

  it(`has the save button enabled after a failed submission`, async () => {
    const { user } = await renderNewForm(CheckType.HTTP);

    server.use(
      apiRoute(`addCheck`, {
        result: () => {
          return {
            status: 409,
            json: {
              err: 'target/job combination already exists',
              msg: 'Failed to add check to database',
            },
          };
        },
      })
    );

    await fillMandatoryFields({ user, checkType: CheckType.HTTP });
    await submitForm(user);
    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    expect(submitButton).toBeEnabled();
  });

  it(`should display an error message when the frequency is less than the timeout`, async () => {
    const { user } = await renderNewForm(CheckType.Scripted);

    await user.type(screen.getByLabelText('Job name', { exact: false }), `Job`);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), `Instance`);

    await goToSection(user, 2);

    const timeoutMinutesInput = screen.getByLabelText('timeout minutes input');
    const timeoutSecondsInput = screen.getByLabelText('timeout seconds input');

    await user.clear(timeoutMinutesInput);
    await user.clear(timeoutSecondsInput);
    await user.type(timeoutMinutesInput, '1');
    await user.type(timeoutSecondsInput, '30');

    await goToSection(user, 5);

    const minutesInput = screen.getByLabelText('frequency minutes input');
    const secondsInput = screen.getByLabelText('frequency seconds input');
    await user.clear(minutesInput);
    await user.clear(secondsInput);
    await user.type(minutesInput, `{backspace}1`);
    await user.type(secondsInput, '10');

    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PUBLIC_PROBE).displayName);
    await user.click(probeCheckbox);

    await submitForm(user);

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(/Frequency must be greater than or equal to timeout \(90 seconds\)/);
  });

  // jsdom doesn't give us back the submitter of the form, so we can't test this
  // https://github.com/jsdom/jsdom/issues/3117
  it.skip(`should show an error message when it fails to test a check`, async () => {});
});
