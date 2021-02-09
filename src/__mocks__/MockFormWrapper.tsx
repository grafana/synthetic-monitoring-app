import React, { PropsWithChildren } from 'react';
import { useForm, FormContext } from 'react-hook-form';

interface Props {
  defaultValues: any;
}

export const MockFormWrapper = ({ defaultValues, children }: PropsWithChildren<Props>) => {
  const formMethods = useForm({ defaultValues });
  return <FormContext {...formMethods}>{children}</FormContext>;
};
