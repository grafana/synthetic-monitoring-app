import React, { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { z } from 'zod';
import { render } from 'test/render';

import { FormLayout } from './FormLayout';

type TestValues = {
  job: string;
};

type TestFormProps = { children: ReactNode };

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
    expect(text).toBeVisible();
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
    expect(text).toBeVisible();
  });

  it(`shows an error icon if any of the fields in that section have errors`, async () => {
    const { container, user } = render(
      <TestForm>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <NameInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </TestForm>
    );

    const submitButton = await screen.findByText(`Submit`);
    await user.click(submitButton);
    const errorIcon = await container.querySelector(`svg[name='exclamation-triangle']`);
    expect(errorIcon).toBeVisible();
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
    expect(text).toBeVisible();
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
    expect(text).toBeVisible();
    expect(await screen.queryByText(firstSectionText)).not.toBeInTheDocument();
    expect(await screen.queryByText(secondSectionText)).not.toBeInTheDocument();
  });
});

const TestForm = ({ children }: TestFormProps) => {
  const formMethods = useForm<TestValues>({
    defaultValues: {
      job: ``,
    },
  });

  return (
    <FormProvider {...formMethods}>
      <FormLayout
        onSubmit={formMethods.handleSubmit}
        onValid={(v) => v}
        schema={z.object({
          job: z.string().min(1),
        })}
      >
        {children}
      </FormLayout>
    </FormProvider>
  );
};

const NameInput = () => {
  const { register } = useFormContext<TestValues>();

  return <input {...register('job')} />;
};
