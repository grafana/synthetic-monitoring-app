import React from 'react';
import { Stack, TextLink } from '@grafana/ui';

import { DNS_RESPONSE_CODES } from 'components/constants';

import { CHECK_TYPE_TIMEOUT_MAP, FIELD_SPACING } from '../../../constants';
import { FormDnsRegExpValidationField } from '../FormDnsRegExpValidationField';
import { FormTimeoutField } from '../FormTimeoutField';
import { GenericMultiSelectField } from '../generic/GenericMultiSelectField';

export function DnsUptimeSection() {
  return (
    <Stack direction="column" gap={FIELD_SPACING}>
      <GenericMultiSelectField
        placeholder="Select valid response codes"
        field="settings.dns.validRCodes"
        label="Valid response codes"
        description="List of valid response codes"
        options={DNS_RESPONSE_CODES}
      />

      <FormDnsRegExpValidationField
        field="settings.dns.validations"
        label="Response regexp validation"
        description={
          <>
            Check fails if condition matches regexp (
            <TextLink color="link" variant="bodySmall" external href="https://github.com/google/re2/wiki/Syntax">
              Go syntax
            </TextLink>
            ).
          </>
        }
      />

      <FormTimeoutField field="timeout" {...CHECK_TYPE_TIMEOUT_MAP.dns} />
    </Stack>
  );
}
