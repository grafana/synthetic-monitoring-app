import { ComponentProps } from 'react';

import { formTestRenderer } from './__test__/formTestRenderer';
import { FormDnsRecordTypeField } from './FormDnsRecordTypeField';

const defaultProps = {
  field: 'value',
} as any;

function renderComponent(
  props?: Partial<ComponentProps<typeof FormDnsRecordTypeField>>,
  formValues: any = { value: '' }
) {
  return formTestRenderer(FormDnsRecordTypeField, { ...defaultProps, ...props });
}

describe('FormDnsRecordTypeField', () => {
  // Combobox requires some funky setup to not crash
  it('should render without crashing', () => {
    renderComponent();
  });
});
