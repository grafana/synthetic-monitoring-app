import React, { Fragment, useState } from 'react';
import { Controller, useFieldArray, useFormContext } from 'react-hook-form';
import {
  Button,
  Checkbox,
  Container,
  Field,
  HorizontalGroup,
  IconButton,
  Input,
  Label,
  MultiSelect,
  Select,
  useTheme2,
} from '@grafana/ui';
import { css } from '@emotion/css';

import { Collapse } from 'components/Collapse';
import { LabelField } from 'components/LabelField';

import {
  DNS_PROTOCOLS,
  DNS_RECORD_TYPES,
  DNS_RESPONSE_CODES,
  DNS_RESPONSE_MATCH_OPTIONS,
  IP_OPTIONS,
} from './constants';

interface Props {
  isEditor: boolean;
}

const DnsSettingsForm = ({ isEditor }: Props) => {
  const { spacing } = useTheme2();

  const { register, control, formState } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.dns.validations',
  });

  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDNSSettings, setShowDNSSettings] = useState(false);
  return (
    <Container>
      <Collapse label="DNS settings" onToggle={() => setShowDNSSettings(!showDNSSettings)} isOpen={showDNSSettings}>
        <div
          className={css`
            max-width: 240px;
          `}
        >
          <Field label="Record type" disabled={!isEditor}>
            <Controller
              name="settings.dns.recordType"
              render={({ field }) => <Select {...field} options={DNS_RECORD_TYPES} />}
            />
          </Field>
          <Field label="Server" disabled={!isEditor}>
            <Input
              id="dns-settings-server-address"
              {...register('settings.dns.server')}
              type="text"
              placeholder="server"
            />
          </Field>
          <Field label="Protocol" disabled={!isEditor}>
            <Controller
              render={({ field }) => <Select {...field} options={DNS_PROTOCOLS} />}
              name="settings.dns.protocol"
            />
          </Field>
          <Field label="Port" disabled={!isEditor}>
            <Input id="dns-settings-port" {...register('settings.dns.port')} type="number" placeholder="port" />
          </Field>
        </div>
      </Collapse>
      <Collapse label="Validation" onToggle={() => setShowValidation(!showValidation)} isOpen={showValidation}>
        <HorizontalGroup>
          <Field label="Valid response codes" description="List of valid response codes" disabled={!isEditor}>
            <Controller
              name="settings.dns.validRCodes"
              render={({ field }) => (
                <MultiSelect {...field} options={DNS_RESPONSE_CODES} defaultValue={[DNS_RESPONSE_CODES[0]]} />
              )}
            />
          </Field>
        </HorizontalGroup>
        <Label>Valid Response Matches</Label>
        {Boolean(fields.length) && (
          <div
            className={css`
              display: grid;
              grid-template-columns: auto auto 70px auto;
              grid-gap: ${spacing(1)};
              align-items: center;
            `}
          >
            <Label>DNS Response Match</Label>
            <Label>Expression</Label>
            <Label>Invert Match</Label>
            <div />
            {fields.map((field, index) => (
              <Fragment key={field.id}>
                <Controller
                  name={`settings.dns.validations.${index}.responseMatch` as const}
                  rules={{ required: true }}
                  render={({ field }) => {
                    return (
                      <Select
                        {...field}
                        value={field.value}
                        data-testid={`dnsValidationResponseMatch${index}`}
                        options={DNS_RESPONSE_MATCH_OPTIONS}
                        invalid={formState.errors.settings?.dns?.validations?.[index]?.responseMatch}
                      />
                    );
                  }}
                />
                <Input
                  {...register(`settings.dns.validations.${index}.expression` as const)}
                  placeholder="Type expression"
                />
                <div
                  className={css`
                    position: relative;
                    justify-self: center;
                  `}
                >
                  <Checkbox
                    {...register(`settings.dns.validations.${index}.inverted` as const)}
                    aria-label="dns-validation-inverted"
                  />
                </div>
                <IconButton name="minus-circle" onClick={() => remove(index)} tooltip="Delete" />
              </Fragment>
            ))}
          </div>
        )}
        <Button
          onClick={() => append({ responseMatch: DNS_RESPONSE_MATCH_OPTIONS[0], expression: '', inverted: false })}
          type="button"
          variant="secondary"
          className={css`
            margin: ${spacing(1)} 0 ${spacing(2)} 0;
          `}
          size="sm"
          disabled={!isEditor}
        >
          Add RegEx Validation
        </Button>
      </Collapse>
      <Collapse label="Advanced options" onToggle={() => setShowAdvanced(!showAdvanced)} isOpen={showAdvanced}>
        <LabelField isEditor={isEditor} />
        <HorizontalGroup>
          <Field label="IP version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
            <Controller
              name="settings.dns.ipVersion"
              render={({ field }) => <Select {...field} options={IP_OPTIONS} />}
            />
          </Field>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};

export default DnsSettingsForm;
