import React, {
  ComponentPropsWithoutRef,
  ElementType,
  Fragment,
  isValidElement,
  PropsWithChildren,
  ReactNode,
} from 'react';
import { FormProvider, useForm, useFormContext } from 'react-hook-form';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

export enum TestFormTestId {
  Form = 'TestForm',
  InfoContainer = 'TestForm TestFormValueInfo',
  Value = 'TestForm TestFormValueInfo Value',
  TypeOf = 'TestForm TestFormValueInfo Type',
}

function outputValue(value: unknown): ReactNode {
  if (!isValidElement(value) && typeof value === 'object' && value !== null) {
    try {
      return JSON.stringify(value);
    } catch (error) {
      console.error('outputValue error:', error);
      return null;
    }
  }
  return value as ReactNode;
}

function TestForm({ children, defaultValues = {} }: PropsWithChildren<{ defaultValues: any }>) {
  const { disabled = false, ...formValues } = defaultValues;
  const formMethods = useForm({
    defaultValues: formValues,
    disabled,
    mode: 'onChange',
  });

  return (
    <FormProvider {...formMethods}>
      <form data-testid={TestFormTestId.Form}>{children}</form>
    </FormProvider>
  );
}

function TestFormValueInfo({ field }: { field: string }) {
  const { watch } = useFormContext();
  const value = watch(field);
  return (
    <div data-testid="TestForm TestFormValueInfo">
      <div data-testid={TestFormTestId.Value}>{outputValue(value)}</div>
      <div data-testid={TestFormTestId.TypeOf}>{typeof value}</div>
    </div>
  );
}

export function formTestRenderer<T extends ElementType = ElementType>(
  FieldComponent: T,
  props?: ComponentPropsWithoutRef<T>,
  defaultValues: any = {}, // `disabled` is reserved for disabling the form @see `TestForm`
  Wrapper?: ElementType
) {
  const WrapperComponent = Wrapper ? Wrapper : Fragment;

  render(
    <WrapperComponent>
      <TestForm defaultValues={defaultValues}>
        {/* @ts-expect-error */}
        <FieldComponent {...props} />
        {props?.field && <TestFormValueInfo field={props?.field} />}
      </TestForm>
    </WrapperComponent>
  );

  return userEvent.setup();
}
