import { screen, within } from '@testing-library/react';
import {
  BASIC_DNS_CHECK,
  BASIC_HTTP_CHECK,
  BASIC_PING_CHECK,
  BASIC_TCP_CHECK,
  BASIC_TRACEROUTE_CHECK,
} from 'test/fixtures/checks';

import { Check, CheckType } from 'types';
import { getBaseFormValuesFromCheck } from 'components/Checkster/transformations/toFormValues.utils';

import { renderEditForm } from '../../../../__testHelpers__/checkForm';

export const CHECK_LIST_MAP: Record<string, Check> = {
  [CheckType.Http]: BASIC_HTTP_CHECK,
  [CheckType.Ping]: BASIC_PING_CHECK,
  // [CheckType.Grpc]: BASIC_GRPC_CHECK,
  [CheckType.Dns]: BASIC_DNS_CHECK,
  [CheckType.Tcp]: BASIC_TCP_CHECK,
  [CheckType.Traceroute]: BASIC_TRACEROUTE_CHECK,
};

describe('Api endpoint checks - common fields', () => {
  Object.entries(CHECK_LIST_MAP).forEach(([cType, check]) => {
    describe(`${cType}`, () => {
      describe(`Section 1 (Request)`, () => {
        it(`request types are disabled when editing a check`, async () => {
          await renderEditForm(check.id);

          const requestTypeRadioButtonGroup = screen.getByLabelText('Request type');

          within(requestTypeRadioButtonGroup)
            .getAllByRole('radio')
            .forEach((radio) => {
              expect(radio).toBeDisabled();
            });
        });
      });
    });
  });

  describe('Folder field', () => {
    it('leaves folderUid undefined when a check has none', () => {
      const formValues = getBaseFormValuesFromCheck(BASIC_HTTP_CHECK);
      expect(formValues.folderUid).toBeUndefined();
    });

    it('preserves the folderUid when a check has one', () => {
      const checkWithFolder = { ...BASIC_HTTP_CHECK, folderUid: 'custom-folder' };
      const formValues = getBaseFormValuesFromCheck(checkWithFolder);
      expect(formValues.folderUid).toBe('custom-folder');
    });
  });
});
