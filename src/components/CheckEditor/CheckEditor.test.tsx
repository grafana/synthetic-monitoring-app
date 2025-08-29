import React, { PropsWithChildren } from 'react';
import { screen, within } from '@testing-library/react';
import { render } from 'test/render';

import { CheckType, CheckTypeGroup, FeatureName } from '../../types';

import { DataTestIds } from '../../test/dataTestIds';
import { mockFeatureToggles } from '../../test/utils';
import { CheckEditor } from './CheckEditor';
import { DEFAULT_FORM_SECTION_ORDER, LEGACY_FORM_SECTION_ORDER } from './CheckEditor.constants';
import { createSectionIndexMap, getStep1Label } from './CheckEditor.utils';
import { CheckEditorContextProvider } from './CheckEditorContext';
import { FormSection } from './FormSection';

// The "submit" button is only visible as the last step (if not rendered outside the CheckForm)
// This function navigates to the last step of the form and makes sure that there is a "submit" button
async function goToLastStep(result: ReturnType<typeof render>) {
  const navigationContainer = await screen.findByTestId(DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION);
  const steps = await within(navigationContainer).findAllByRole('button');
  const lastStep = steps[steps.length - 1];
  await result.user.click(lastStep);
  await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON); // Wait for the form to be rendered

  return result;
}

async function goToFirstStep(result: ReturnType<typeof render>) {
  const navigationContainer = await screen.findByTestId(DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION);
  const [firstStep] = await within(navigationContainer).findAllByRole('button');
  await result.user.click(firstStep);
}

describe('CheckEditor', () => {
  beforeEach(() => {
    mockFeatureToggles({
      [FeatureName.AlertsPerCheck]: true,
      [FeatureName.ScriptedChecks]: true,
      [FeatureName.BrowserChecks]: true,
      [FeatureName.GRPCChecks]: true,
    });
  });

  const errorIconName = 'times';
  // const successIconName = 'check';

  it('should render without props', async () => {
    await renderTestCheckEditor();
    expect(await screen.findByTestId(DataTestIds.CHECK_EDITOR)).toBeInTheDocument();
  });

  it.each([
    [CheckTypeGroup.ApiTest, CheckType.HTTP, getStep1Label(CheckType.HTTP)],
    [CheckTypeGroup.MultiStep, CheckType.MULTI_HTTP, getStep1Label(CheckType.MULTI_HTTP)],
    [CheckTypeGroup.Browser, CheckType.Browser, getStep1Label(CheckType.Browser)],
    [CheckTypeGroup.Scripted, CheckType.Scripted, getStep1Label(CheckType.Scripted)],
  ])('[%s.%s] automatically show the first section/step (%s)', async (checkTypeGroup, checkType, firstSectionLabel) => {
    await renderTestCheckEditor({ checkTypeGroup });
    const actionBar = await screen.findByTestId(DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION);
    const [firstButton] = await within(actionBar).findAllByRole('button');
    expect(firstButton).toHaveTextContent(firstSectionLabel);
  });

  it('automatically show the second section/step (initialSectionIndex)', async () => {
    const secondSectionText = 'Second test section';
    render(
      <TestCheckEditor initialSectionIndex={1}>
        <FormSection index={0} label="First Section">
          First test section
        </FormSection>
        <FormSection index={1} label="Second Section">
          {secondSectionText}
        </FormSection>
      </TestCheckEditor>
    );

    const text = await screen.findByText(secondSectionText);
    expect(text).toBeInTheDocument();
  });

  it.each([
    ['default', DEFAULT_FORM_SECTION_ORDER, true],
    ['legacy', LEGACY_FORM_SECTION_ORDER, false],
  ])(
    `[order: %s] shows an error icon if any of the fields in that section have errors`,
    async (orderType, orderArray, alertsPerCheck) => {
      mockFeatureToggles({
        [FeatureName.AlertsPerCheck]: alertsPerCheck,
        [FeatureName.ScriptedChecks]: true,
        [FeatureName.BrowserChecks]: true,
        [FeatureName.GRPCChecks]: true,
      });

      const sectionIndexMap = createSectionIndexMap(orderArray);

      const result = await renderTestCheckEditor();
      await goToLastStep(result); // going to the last step will trigger the validation of the section buttons (except for the last section)
      await goToFirstStep(result); // going back to the first step will show all potential icons
      const actionBar = await screen.findByTestId(DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION);
      const buttons = await within(actionBar).findAllByRole('button');
      const svgSelector = `svg[name='${errorIconName}']`;

      // The following sections should have an error icon
      expect(buttons[sectionIndexMap.job]).toHaveTextContent('Request');
      expect(buttons[sectionIndexMap.job].querySelector(svgSelector)).toBeInTheDocument();
      expect(buttons[sectionIndexMap.execution]).toHaveTextContent('Execution');
      expect(buttons[sectionIndexMap.execution].querySelector(svgSelector)).toBeInTheDocument();

      // The following sections should not have an error icon
      expect(buttons[sectionIndexMap.uptime]).toHaveTextContent('Uptime');
      expect(buttons[sectionIndexMap.uptime].querySelector(svgSelector)).not.toBeInTheDocument();
      expect(buttons[sectionIndexMap.labels]).toHaveTextContent('Labels');
      expect(buttons[sectionIndexMap.labels].querySelector(svgSelector)).not.toBeInTheDocument();
      expect(buttons[sectionIndexMap.alerting]).toHaveTextContent('Alerting');
      expect(buttons[sectionIndexMap.alerting].querySelector(svgSelector)).not.toBeInTheDocument();
    }
  );

  it('should not show an error icon if the form is disabled', async () => {
    const result = await renderTestCheckEditor({ disabled: true });
    await goToLastStep(result); // going to the last step will trigger the validation of the section buttons (except for the last section)
    await goToFirstStep(result); // going back to the first step will show all potential icons
    const actionBar = await screen.findByTestId(DataTestIds.CHECK_EDITOR_MAIN_NAVIGATION);
    const svgSelector = `svg[name='${errorIconName}']`;
    expect(actionBar.querySelectorAll(svgSelector)).toHaveLength(0);
  });

  describe('Action buttons', () => {
    it('should only show "next" button when on first section', async () => {
      await renderTestCheckEditor();
      // This happens to be the same in both default and legacy orders (update this if that changes)
      const nextButtonText = 'Uptime';
      const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);

      const nextButton = await within(actionBar).findAllByRole('button');
      expect(nextButton).toHaveLength(1); // there should only be one button in the first step
      // This happens to be the same in both default and legacy orders (update this if that changes)
      expect(nextButton[0]).toHaveTextContent(nextButtonText);
    });

    it('should only show "submit" button when on last section', async () => {
      const result = await renderTestCheckEditor();
      const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
      expect(within(actionBar).queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
      await goToLastStep(result);
      expect(within(actionBar).queryByRole('button', { name: 'Save' })).toBeInTheDocument();
    });

    it('should allow user to navigate to the next section', async () => {
      const firstStepText = getStep1Label(CheckType.HTTP); // HTTP is the default check type
      // This happens to be the same in both default and legacy orders (update this if that changes)
      const secondStepText = 'Uptime';
      const thirdStepText = 'Labels';

      const sectionHeadingSelector = 'h2 > div';

      const { user } = await renderTestCheckEditor();
      const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
      // First section
      expect(await screen.findByText(firstStepText, { selector: sectionHeadingSelector })).toBeInTheDocument();
      const [uptimeButtonNext] = await within(actionBar).findAllByRole('button');
      expect(uptimeButtonNext).toHaveTextContent(secondStepText);
      await user.click(uptimeButtonNext);

      // Second section
      expect(await screen.findByText(secondStepText, { selector: sectionHeadingSelector })).toBeInTheDocument();
      const [prevButton, nextButton] = await within(actionBar).findAllByRole('button');
      expect(prevButton).toHaveTextContent(firstStepText);
      expect(nextButton).toHaveTextContent(thirdStepText);
      await user.click(prevButton);

      // Should be back on the first section
      expect(await screen.findByText(firstStepText, { selector: sectionHeadingSelector })).toBeInTheDocument();
    });

    it('should disable the "submit" button if the form has not been modified', async () => {
      const result = await renderTestCheckEditor();
      await goToLastStep(result);
      const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
      const submitButton = await within(actionBar).findByRole('button', { name: 'Save' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toBeDisabled();

      await goToFirstStep(result);
      const jobInput = screen.getByRole('textbox', { name: /Job name/ });
      expect(jobInput).toBeInTheDocument();
      const { user } = result;
      await user.type(jobInput, 'my-job-name');
      await goToLastStep(result);

      // A new instance of the form is rendered, so we need to find the button again
      expect(await within(actionBar).findByRole('button', { name: 'Save' })).not.toBeDisabled();
    });

    it('should have a submit button with the correct text ("Save")', async () => {
      const result = await renderTestCheckEditor();
      await goToLastStep(result);
      const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
      const submitButton = await within(actionBar).findByRole('button', { name: 'Save' });
      expect(submitButton).toBeInTheDocument();
      expect(submitButton).toHaveTextContent('Save');
    });
  });

  // This test assumes that the `target` field to be in the first section and that it is required
  it('should got to the first section with error when the form is submitted', async () => {
    const result = await renderTestCheckEditor();
    const actionBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
    const jobInput = screen.getByRole('textbox', { name: /Job name/ });
    const { user } = result;
    await user.type(jobInput, 'my-job-name');
    await goToLastStep(result);
    const submitButton = await within(actionBar).findByRole('button', { name: 'Save' });
    await user.click(submitButton);
    const sectionHeadingSelector = 'h2 > div';
    // Should be back on the first section
    expect(await screen.findByText('Request', { selector: sectionHeadingSelector })).toBeInTheDocument();
    expect(await screen.findByText(/Target must be a valid web URL/)).toBeInTheDocument();
  });
});

interface TestCheckEditorProps extends PropsWithChildren {
  checkTypeGroup?: CheckTypeGroup;
  initialSectionIndex?: number;
  disabled?: boolean;
}

async function renderTestCheckEditor(props?: TestCheckEditorProps) {
  const result = render(<TestCheckEditor {...props} />);

  await screen.findByTestId(DataTestIds.CHECK_EDITOR);

  return result;
}

function TestCheckEditor({
  checkTypeGroup = CheckTypeGroup.ApiTest,
  initialSectionIndex,
  disabled,
  children,
}: TestCheckEditorProps) {
  return (
    <CheckEditorContextProvider
      checkTypeGroup={checkTypeGroup}
      initialSectionIndex={initialSectionIndex}
      disabled={disabled}
    >
      <CheckEditor>{children}</CheckEditor>
    </CheckEditorContextProvider>
  );
}
