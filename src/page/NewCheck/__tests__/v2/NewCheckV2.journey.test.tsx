import { screen, waitFor, within } from '@testing-library/react';
import { trackCheckCreated } from 'features/tracking/checkFormEvents';
import { CHECKSTER_TEST_ID, DataTestIds } from 'test/dataTestIds';
import { BASIC_HTTP_CHECK } from 'test/fixtures/checks';
import { PUBLIC_PROBE } from 'test/fixtures/probes';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';
import {
  mockFeatureToggles,
  probeToMetadataProbe,
  runTestAsHGFreeUserOverLimit,
  runTestWithoutLogsAccess,
} from 'test/utils';

import { FormSectionName } from '../../../../components/Checkster/types';
import { CheckAlertType, CheckType, FeatureName } from 'types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { gotoSection, submitForm } from 'components/Checkster/__testHelpers__/formHelpers';
import { renderNewFormV2, selectBasicFrequency } from 'page/__testHelpers__/checkForm';

import { fillMandatoryFields } from '../../../__testHelpers__/v2.utils';

jest.mock('features/tracking/checkFormEvents', () => ({
  trackCheckCreated: jest.fn(),
  trackCheckUpdated: jest.fn(),
  trackNavigateWizardForm: jest.fn(),
  trackAdhocCreated: jest.fn(),
  trackNeedHelpScriptsButtonClicked: jest.fn(),
}));

describe(`<NewCheckV2 /> journey`, () => {
  it(`should show an error message when it fails to save a check`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);

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
    const form = screen.getByTestId(CHECKSTER_TEST_ID.form.root);

    expect(within(form).getByText(/Save failed/)).toBeInTheDocument();
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

    await renderNewFormV2(CheckType.HTTP);
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

    await renderNewFormV2(CheckType.HTTP);
    const jobInput = screen.getByLabelText(/Job name/);
    expect(jobInput).toBeInTheDocument();
    expect(jobInput).toBeDisabled();
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

    const { container } = await renderNewFormV2(CheckType.HTTP);
    expect(container.querySelector('#check-editor-job-input')).not.toBeDisabled();
  });

  it(`should show the mothly execution limit warning when the limit is reached for HG free tier customers`, async () => {
    runTestAsHGFreeUserOverLimit();

    await renderNewFormV2(CheckType.HTTP);
    expect(await screen.findByText(/You have reached your monthly execution limit of/)).toBeInTheDocument();
  });

  it(`should disable the form when the mothly execution limit is reached for HG free tier customers`, async () => {
    runTestAsHGFreeUserOverLimit();

    await renderNewFormV2(CheckType.HTTP);
    expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
  });

  it(`should focus the probes filter component when appropriate`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['probes'] });
    await submitForm(user);

    const probesFilter = await screen.findByLabelText(/Probe locations/);
    await waitFor(() => expect(probesFilter).toHaveFocus());
  });

  it(`should display an error message when the job name contains commas`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);
    const jobField = screen.getByLabelText(/job name/i);
    await user.type(jobField, 'job name with, comma');
    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);
    screen.getByText(/Job names can't contain commas or quotes/i);
    expect(screen.getByLabelText(/job name/i)).toHaveFocus();
  });

  it(`should display an error message when the job name contains single quotes`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);
    const jobField = screen.getByLabelText(/job name/i);
    await user.type(jobField, `job name with ' single quote`);
    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    expect(screen.getByText(/Job names can't contain commas or quotes/)).toBeInTheDocument();
    expect(screen.getByLabelText(/job name/i)).toHaveFocus();
  });

  it(`should display an error message when the job name contains double quotes`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);
    const jobField = screen.getByLabelText(/job name/i);
    await user.type(jobField, 'job name with " double quote');

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    expect(jobField).not.toBeDisabled();

    await submitForm(user);

    await Promise.resolve();

    expect(jobField).not.toBeDisabled();
    await waitFor(() => expect(screen.getByLabelText(/job name/i)).toHaveFocus(), { timeout: 5000 });

    expect(screen.getByText(/Job names can't contain commas or quotes/)).toBeInTheDocument();
  });

  it(`trims white spaces from job name`, async () => {
    const { read, user } = await renderNewFormV2(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `   my job name   `);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const { body } = await read();
    expect(body.job).toBe('my job name');
  });

  it(`should disable the test button when the user doesn't have logs access`, async () => {
    runTestWithoutLogsAccess();
    await renderNewFormV2(CheckType.HTTP);

    const testButton = screen.getByRole(`button`, { name: /Test/ });
    expect(testButton).toBeInTheDocument();
    expect(testButton).toHaveAttribute('aria-disabled', 'true');
  });

  it(`disables the submit button by default`, async () => {
    await renderNewFormV2(CheckType.HTTP);
    expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).not.toBeEnabled();
  });

  it(`enables the submit button when a field is edited`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);
    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, 'My Job Name');
    const submitButton = await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton);
    expect(submitButton).toBeEnabled();
  });

  it(`has the save button enabled after a failed submission`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);

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
    const submitButton = await screen.findByTestId(CHECKSTER_TEST_ID.form.submitButton);
    expect(submitButton).toBeEnabled();
  });

  it(`should display an error message when the frequency is less than the timeout`, async () => {
    const { user } = await renderNewFormV2(CheckType.Scripted);

    await user.type(screen.getByLabelText('Job name', { exact: false }), `Job`);
    await user.type(screen.getByLabelText(`Instance`, { exact: false }), `Instance`);

    await gotoSection(user, FormSectionName.Uptime);

    const timeoutMinutesInput = screen.getByLabelText('timeout minutes input');
    const timeoutSecondsInput = screen.getByLabelText('timeout seconds input');

    await user.clear(timeoutMinutesInput);
    await user.clear(timeoutSecondsInput);
    await user.type(timeoutMinutesInput, '2');
    await user.type(timeoutSecondsInput, '30');

    await gotoSection(user, FormSectionName.Execution);

    await selectBasicFrequency(user, '2m');

    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PUBLIC_PROBE).displayName);
    await user.click(probeCheckbox);

    await submitForm(user);

    const errorMsg = await screen.findByRole('alert');
    expect(errorMsg).toBeInTheDocument();
    expect(errorMsg).toHaveTextContent(/Frequency must be greater than or equal to timeout \(3 minutes\)/);
  });

  it(`should revalidate the form when the frequency is changed`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewFormV2(CheckType.HTTP);
    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['probes'] });
    await gotoSection(user, FormSectionName.Execution);
    const probeCheckbox = await screen.findByLabelText(probeToMetadataProbe(PUBLIC_PROBE).displayName);
    await user.click(probeCheckbox);

    await gotoSection(user, FormSectionName.Alerting);
    await user.click(screen.getByLabelText('Enable Probe Failed Executions Too High alert'));
    const thresholdsInput =
      CHECKSTER_TEST_ID.feature.perCheckAlerts[CheckAlertType.ProbeFailedExecutionsTooHigh].thresholdInput;
    await user.clear(screen.getByTestId(thresholdsInput));
    await user.type(screen.getByTestId(thresholdsInput), '6');
    await submitForm(user);
    expect(screen.getByRole('alert')).toBeInTheDocument();

    await gotoSection(user, FormSectionName.Execution);
    await selectBasicFrequency(user, '10s');

    await gotoSection(user, FormSectionName.Alerting);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it(`should redirect to check the dashboard when the check is created`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);

    const jobNameInput = await screen.findByLabelText('Job name', { exact: false });
    await user.type(jobNameInput, `   my job name   `);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP, fieldsToOmit: ['job'] });
    await submitForm(user);

    const pathInfo = await screen.findByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME);
    expect(pathInfo).toHaveTextContent(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! }));
  });

  it(`should enable the save button when an alert is enabled`, async () => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
    });

    const { user } = await renderNewFormV2(CheckType.HTTP);

    await gotoSection(user, FormSectionName.Alerting);
    expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).toBeDisabled();
    await user.click(screen.getByLabelText('Enable Probe Failed Executions Too High alert'));
    expect(screen.getByTestId(CHECKSTER_TEST_ID.form.submitButton)).not.toBeDisabled();
  });

  it(`should track check creation with check type`, async () => {
    const { user } = await renderNewFormV2(CheckType.HTTP);

    await fillMandatoryFields({ user, checkType: CheckType.HTTP });
    await submitForm(user);

    await waitFor(() => {
      const pathInfo = screen.getByTestId(DataTestIds.TEST_ROUTER_INFO_PATHNAME);
      expect(pathInfo).toHaveTextContent(generateRoutePath(AppRoutes.CheckDashboard, { id: BASIC_HTTP_CHECK.id! }));
    });

    expect(trackCheckCreated).toHaveBeenCalledWith({ checkType: CheckType.HTTP });
  });
});
