import React from 'react';
import { FieldValues, FormProvider, useForm, useFormContext } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { screen, within } from '@testing-library/react';
import { z } from 'zod';
import { DataTestIds } from 'test/dataTestIds';
import { render } from 'test/render';

import { CheckType } from 'types';

import { FormLayout, type FormLayoutProps } from './FormLayout';
import { FormLayoutContextProvider } from './FormLayoutContext';

describe(`FormLayout`, () => {
  it(`automatically has the first step open`, async () => {
    const firstSectionText = `First section content`;

    render(
      <TestForm>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const text = await screen.findByText(firstSectionText);
    expect(text).toBeInTheDocument();
  });

  it(`only indexes children that are formSection`, async () => {
    const firstSectionText = `First section content`;

    render(
      <TestForm>
        <div>Some child that means the formlayout section is not first</div>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
      </TestForm>
    );

    const text = await screen.findByText(firstSectionText);
    expect(text).toBeInTheDocument();
  });

  it(`shows an error icon if any of the fields in that section have errors`, async () => {
    const { container, user } = render(
      <TestForm>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    await user.click(submitButton);
    const errorIcon = await container.querySelector(`svg[name='exclamation-triangle']`);
    expect(errorIcon).toBeInTheDocument();
  });

  it(`moves between wizard steps with buttons`, async () => {
    const firstSectionText = `First section content`;
    const secondSectionText = `Second section content`;

    const { user } = render(
      <TestForm>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    expect(await screen.findByText(firstSectionText)).toBeInTheDocument();
    const next = await screen.findByRole('button', { name: '2. Second section' });
    await user.click(next);
    const text = await screen.findByText(secondSectionText);
    expect(text).toBeInTheDocument();
    expect(await screen.queryByText(firstSectionText)).not.toBeInTheDocument();
  });

  it(`moves between wizard steps with sidebar`, async () => {
    const firstSectionText = `First section content`;
    const secondSectionText = `Second section content`;
    const thirdSectionText = `Third section content`;

    const { user } = render(
      <TestForm>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>{secondSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Third section">
          <div>{thirdSectionText}</div>
        </FormLayout.Section>
      </TestForm>
    );

    const initialText = await screen.findByText(firstSectionText);
    expect(initialText).toBeInTheDocument();
    expect(await screen.queryByText(thirdSectionText)).not.toBeInTheDocument();
    const next = await screen.findByText('Third section');
    await user.click(next);
    const text = await screen.findByText(thirdSectionText);
    expect(text).toBeInTheDocument();
    expect(await screen.queryByText(firstSectionText)).not.toBeInTheDocument();
    expect(await screen.queryByText(secondSectionText)).not.toBeInTheDocument();
  });

  it(`disables the submit button if the form is disabled`, async () => {
    render(
      <TestForm disabled>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    expect(submitButton).toBeDisabled();
  });

  it(`validates previous steps when moving between steps`, async () => {
    const { container, user } = render(
      <TestForm>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
        <FormLayout.Section label="Third section">
          <div>Third section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const next = await screen.findByText(/Third section/);
    await user.click(next);
    const errorIcon = await container.querySelector(`svg[name='exclamation-triangle']`);
    const validIcon = await container.querySelector(`svg[name='check']`);
    expect(errorIcon).toBeInTheDocument();
    expect(validIcon).toBeInTheDocument();
  });

  it(`disables showing validation when the form is disabled`, async () => {
    const { container, user } = render(
      <TestForm disabled>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
        <FormLayout.Section label="Third section">
          <div>Third section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const next = await screen.findByText(/Third section/);
    await user.click(next);
    const errorIcon = await container.querySelector(`svg[name='exclamation-triangle']`);
    const validIcon = await container.querySelector(`svg[name='check']`);
    expect(errorIcon).not.toBeInTheDocument();
    expect(validIcon).not.toBeInTheDocument();
  });

  it(`shows the correct next/previous buttons`, async () => {
    const firstSectionLabel = `First section`;
    const secondSectionLabel = `Second section`;
    const thirdSectionLabel = `Third section`;

    const { user } = render(
      <TestForm>
        <div>{`NOT A FORM SECTION. DON'T COUNT ME`}</div>
        <FormLayout.Section label={firstSectionLabel} fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label={secondSectionLabel}>
          <div>Second section content</div>
        </FormLayout.Section>
        <FormLayout.Section label={thirdSectionLabel}>
          <div>Third section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const actionsBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);

    // when on step 1
    expect(within(actionsBar).getAllByRole(`button`).length).toBe(2);
    expect(within(actionsBar).getByText(secondSectionLabel)).toBeInTheDocument();
    expect(within(actionsBar).queryByText(firstSectionLabel)).not.toBeInTheDocument();
    expect(within(actionsBar).getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).toBeInTheDocument();

    // when on step 2
    await user.click(within(actionsBar).getByText(secondSectionLabel));
    expect(within(actionsBar).getAllByRole(`button`).length).toBe(3);
    expect(within(actionsBar).getByText(firstSectionLabel)).toBeInTheDocument();
    expect(within(actionsBar).queryByText(secondSectionLabel)).not.toBeInTheDocument();
    expect(within(actionsBar).getByText(thirdSectionLabel)).toBeInTheDocument();
    expect(within(actionsBar).getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).toBeInTheDocument();

    // when on step 3
    await user.click(within(actionsBar).getByText(thirdSectionLabel));
    expect(within(actionsBar).getAllByRole(`button`).length).toBe(2);
    expect(within(actionsBar).queryByText(firstSectionLabel)).not.toBeInTheDocument();
    expect(within(actionsBar).getByText(secondSectionLabel)).toBeInTheDocument();
    expect(within(actionsBar).queryByText(thirdSectionLabel)).not.toBeInTheDocument();
    expect(within(actionsBar).getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON)).toBeInTheDocument();
  });

  it(`renders custom action buttons correctly`, async () => {
    const sectionOneCustomButtonText = `Section 1 custom button`;
    const sectionTwoCustomButtonText = `Section 2 custom button`;

    const actions = [
      {
        index: 0,
        element: <button>{sectionOneCustomButtonText}</button>,
      },
      {
        index: 1,
        element: <button>{sectionTwoCustomButtonText}</button>,
      },
    ];

    const { user } = render(
      <TestForm actions={actions}>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const actionsBar = await screen.findByTestId(DataTestIds.ACTIONS_BAR);
    expect(within(actionsBar).getByText(sectionOneCustomButtonText)).toBeInTheDocument();
    expect(within(actionsBar).queryByText(sectionTwoCustomButtonText)).not.toBeInTheDocument();

    await user.click(within(actionsBar).getByText(`Second section`));
    expect(within(actionsBar).queryByText(sectionOneCustomButtonText)).not.toBeInTheDocument();
    expect(within(actionsBar).getByText(sectionTwoCustomButtonText)).toBeInTheDocument();
  });

  it(`moves to the first step with an error on submission`, async () => {
    const secondSectionContent = `Second section content`;
    const thirdSectionContent = `Third section content`;
    const thirdSectionLabel = `Third section`;

    const { user } = render(
      <TestForm>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <JobInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section" fields={[`target`]}>
          <TargetInput />
          <div>{secondSectionContent}</div>
        </FormLayout.Section>
        <FormLayout.Section label={thirdSectionLabel}>
          <div>{thirdSectionContent}</div>
        </FormLayout.Section>
      </TestForm>
    );

    const jobInput = await screen.findByLabelText(`Job`);
    await user.type(jobInput, `job`);
    const lastSection = await screen.findByText(thirdSectionLabel);
    await user.click(lastSection);
    expect(screen.getByText(thirdSectionContent)).toBeInTheDocument();
    await user.click(screen.getByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON));
    const firstSection = await screen.findByText(secondSectionContent);
    expect(firstSection).toBeInTheDocument();
  });

  it('submit button text should be Save', async () => {
    render(
      <TestForm hasUnsavedChanges disabled>
        <FormLayout.Section label="First section">
          <JobInput />
        </FormLayout.Section>
      </TestForm>
    );

    const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
    expect(submitButton).toHaveTextContent('Save');
  });

  describe('hasUnsavedChanges prop', () => {
    it('should disable submit button when false', async () => {
      const { user } = render(
        <TestForm hasUnsavedChanges={false}>
          <FormLayout.Section label="First section">
            <JobInput />
          </FormLayout.Section>
        </TestForm>
      );

      const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
      expect(submitButton).toBeDisabled();

      const jobInput = await screen.findByLabelText('Job');
      jobInput.focus();
      await user.type(jobInput, 'job');
      expect(jobInput).toBeEnabled();
    });

    it('should enable submit button when undefined', async () => {
      render(
        <TestForm hasUnsavedChanges>
          <FormLayout.Section label="First section">
            <JobInput />
          </FormLayout.Section>
        </TestForm>
      );

      const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
      expect(submitButton).toBeEnabled();
    });

    it('should enable submit button when true', async () => {
      render(
        <TestForm hasUnsavedChanges>
          <FormLayout.Section label="First section">
            <JobInput />
          </FormLayout.Section>
        </TestForm>
      );

      const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
      expect(submitButton).toBeEnabled();
    });

    it('should not enable submit button when form is disabled', async () => {
      render(
        <TestForm hasUnsavedChanges disabled>
          <FormLayout.Section label="First section">
            <JobInput />
          </FormLayout.Section>
        </TestForm>
      );

      const submitButton = await screen.findByTestId(DataTestIds.CHECK_FORM_SUBMIT_BUTTON);
      expect(submitButton).toBeDisabled();
    });
  });
});

type TestValues = {
  job: string;
  target: string;
};

const schema = z.object({
  job: z.string().min(1),
  target: z.string().min(1),
});

const TestForm = <T extends FieldValues>({
  actions,
  children,
  disabled,
  hasUnsavedChanges,
}: Pick<FormLayoutProps<T>, 'actions' | 'children' | 'hasUnsavedChanges'> & { disabled?: boolean }) => {
  const formMethods = useForm<TestValues>({
    defaultValues: {
      job: ``,
      target: ``,
    },
    resolver: zodResolver(schema),
    disabled,
  });

  return (
    <FormProvider {...formMethods}>
      <FormLayoutContextProvider>
        <FormLayout
          checkState="new"
          checkType={CheckType.HTTP}
          actions={actions}
          onSubmit={formMethods.handleSubmit}
          onValid={(v) => v}
          schema={schema}
          hasUnsavedChanges={hasUnsavedChanges}
        >
          {children}
        </FormLayout>
      </FormLayoutContextProvider>
    </FormProvider>
  );
};

const JobInput = () => {
  const { register } = useFormContext<TestValues>();
  const id = `job`;

  return (
    <>
      <label htmlFor={id}>Job</label>
      <input {...register('job')} id={id} />
    </>
  );
};

const TargetInput = () => {
  const { register } = useFormContext<TestValues>();

  return <input {...register('target')} />;
};
