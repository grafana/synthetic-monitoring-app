import { ComponentProps } from 'react';
import { screen } from '@testing-library/react';

import { testUsesCombobox } from '../../../../test/utils';
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
  it('should render without crashing', async () => {
    testUsesCombobox();
    const user = renderComponent();

    await user.click(screen.getByLabelText('Record type'));
    await user.click(screen.getByRole('option', { name: /CNAME/i }));

    expect(screen.getByLabelText('Record type')).toHaveValue('CNAME');
  });
});
