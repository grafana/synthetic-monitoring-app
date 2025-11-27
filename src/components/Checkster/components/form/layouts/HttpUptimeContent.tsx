import React from 'react';
import { useFormContext } from 'react-hook-form';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues, HttpMethod } from 'types';

import {
  CHECK_TYPE_TIMEOUT_MAP,
  HTTP_COMPRESSION_ALGO_OPTIONS,
  HTTP_SSL_OPTIONS,
  VALID_HTTP_STATUS_CODE_OPTIONS,
  VALID_HTTP_VERSION_OPTIONS,
} from '../../../constants';
import { SectionContent } from '../../ui/SectionContent';
import { FormHttpRegExpValidationField } from '../FormHttpRegExpValidationField';
import { FormTimeoutField } from '../FormTimeoutField';
import { GenericMultiSelectField } from '../generic/GenericMultiSelectField';
import { GenericRadioButtonGroupField } from '../generic/GenericRadioButtonGroupField';

export const HTTP_UPTIME_FIELDS = ['settings.http.regexValidations'];

export function HttpUptimeContent() {
  const { watch } = useFormContext<CheckFormValues>();
  const disallowBodyMatching = watch('settings.http.method') === HttpMethod.HEAD;

  return (
    <SectionContent>
      <GenericMultiSelectField
        data-testid={CHECKSTER_TEST_ID.form.inputs.validStatusCodes}
        options={VALID_HTTP_STATUS_CODE_OPTIONS}
        field="settings.http.validStatusCodes"
        label="Valid status codes"
        description="Accepted status codes for this check. Defaults to 2xx."
        placeholder="2xx"
      />

      <GenericMultiSelectField
        options={VALID_HTTP_VERSION_OPTIONS}
        field="settings.http.validHTTPVersions"
        label="Valid HTTP versions"
        description="Accepted HTTP versions for this check"
        placeholder="Select version(s)"
      />

      <GenericRadioButtonGroupField
        options={HTTP_SSL_OPTIONS}
        field="settings.http.sslOptions"
        label="SSL options"
        description="Choose whether check fails if SSL is present or not present."
      />

      <FormHttpRegExpValidationField
        field="settings.http.regexValidations"
        addButtonText="Regexp validation"
        disallowBodyMatching={disallowBodyMatching}
      />

      <GenericRadioButtonGroupField
        options={HTTP_COMPRESSION_ALGO_OPTIONS}
        field="settings.http.compression"
        label="Compression"
        description="The compression algorithm to expect in the response body"
      />

      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.http} />
    </SectionContent>
  );
}
