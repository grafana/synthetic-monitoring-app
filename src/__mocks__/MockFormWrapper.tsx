import React, { PropsWithChildren } from 'react';
import { useForm, FormProvider } from 'react-hook-form';

interface Props {
  defaultValues: any;
}

export const MockFormWrapper = ({ defaultValues, children }: PropsWithChildren<Props>) => {
  const formMethods = useForm({ defaultValues });
  return <FormProvider {...formMethods}>{children}</FormProvider>;
};
