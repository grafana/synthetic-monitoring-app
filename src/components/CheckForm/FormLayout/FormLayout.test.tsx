import React, { ReactNode } from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { screen } from '@testing-library/react';
import { render } from 'test/render';

import { FormLayout } from './FormLayout';

type TestValues = {
  job: string;
};

type TestFormProps = { children: ReactNode };

const renderTestForm = (children: TestFormProps['children']) => {
  return render(<TestForm>{children}</TestForm>);
};

describe(`FormLayout`, () => {
  it(`automatically has the first step open`, async () => {
    const firstSectionText = `First section content`;

    renderTestForm(
      <FormLayout>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </FormLayout>
    );

    const text = await screen.findByText(firstSectionText);
    expect(text).toBeVisible();
  });

  it(`only indexes children that are formSection`, async () => {
    const firstSectionText = `First section content`;

    renderTestForm(
      <FormLayout>
        <div>Some child that means the formlayout section is not first</div>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
      </FormLayout>
    );

    const text = await screen.findByText(firstSectionText);
    expect(text).toBeVisible();
  });

  it(`shows an error icon if any of the fields in that section have errors`, async () => {
    const { container, user } = renderTestForm(
      <FormLayout>
        <FormLayout.Section label="First section" fields={[`job`]}>
          <NameInput />
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </FormLayout>
    );

    const submitButton = await screen.findByText(`Submit`);
    await user.click(submitButton);
    const errorIcon = await container.querySelector(`svg[name='exclamation-triangle']`);
    expect(errorIcon).toBeVisible();
  });

  it(`moves between wizard steps with buttons`, async () => {
    const firstSectionText = `First section content`;
    const secondSectionText = `Second section content`;

    const { user } = renderTestForm(
      <FormLayout>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>Second section content</div>
        </FormLayout.Section>
      </FormLayout>
    );

    const next = await screen.findByRole('button', { name: 'Second section' });
    await user.click(next);
    const text = await screen.findByText(secondSectionText);
    expect(text).toBeVisible();
    expect(screen.getByText(firstSectionText)).not.toBeVisible();
  });

  it(`moves between wizard steps with sidebar`, async () => {
    const firstSectionText = `First section content`;
    const secondSectionText = `Second section content`;
    const thirdSectionText = `Third section content`;

    const { user } = renderTestForm(
      <FormLayout>
        <FormLayout.Section label="First section">
          <div>{firstSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Second section">
          <div>{secondSectionText}</div>
        </FormLayout.Section>
        <FormLayout.Section label="Third section">
          <div>{thirdSectionText}</div>
        </FormLayout.Section>
      </FormLayout>
    );

    const next = await screen.findByText('Third section');
    await user.click(next);
    const text = await screen.findByText(thirdSectionText);
    expect(text).toBeVisible();
    expect(screen.getByText(firstSectionText)).not.toBeVisible();
    expect(screen.getByText(secondSectionText)).not.toBeVisible();
  });
});

const TestForm = ({ children }: TestFormProps) => {
  const formMethods = useForm<TestValues>({
    defaultValues: {
      job: ``,
    },
  });

  return <FormProvider {...formMethods}>{children}</FormProvider>;
};

const NameInput = () => {
  const { register } = useFormContext<TestValues>();

  return <input {...register('job')} />;
};
