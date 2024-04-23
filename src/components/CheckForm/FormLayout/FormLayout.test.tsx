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
  it(`automatically has the first panel open`, async () => {
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

  it(`allows sections that aren't the first to be open by default`, async () => {
    const firstSectionText = `First section content`;
    const secondSectionText = `Second section content`;

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
    expect(screen.getByText(secondSectionText)).toBeVisible();
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
      <form onSubmit={formMethods.handleSubmit((_, e) => e?.preventDefault())}>
        {children}
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
};

const NameInput = () => {
  const { register } = useFormContext<TestValues>();

  return <input {...register('job', { required: true })} />;
};
