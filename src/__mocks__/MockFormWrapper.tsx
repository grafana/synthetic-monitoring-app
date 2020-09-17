import React, { FC, PropsWithChildren } from 'react';
import { useForm, FormContext } from 'react-hook-form';

interface Props {
  defaultValues: any;
}

export const MockFormWrapper: FC<PropsWithChildren<Props>> = ({ defaultValues, children }) => {
  const formMethods = useForm({ defaultValues });
  return <FormContext {...formMethods}>{children}</FormContext>;
};
