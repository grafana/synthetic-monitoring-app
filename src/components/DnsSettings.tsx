import React, { useState, Fragment } from 'react';
import { css } from 'emotion';
import {
  Container,
  HorizontalGroup,
  Field,
  Select,
  MultiSelect,
  Input,
  Checkbox,
  Button,
  IconButton,
  Label,
  useTheme,
} from '@grafana/ui';
import { useFormContext, Controller, useFieldArray } from 'react-hook-form';
import { ResponseMatchType } from 'types';
import { Collapse } from 'components/Collapse';
import { LabelField } from './LabelField';
import { DNS_RESPONSE_CODES, DNS_RECORD_TYPES, DNS_PROTOCOLS, IP_OPTIONS } from './constants';

interface Props {
  isEditor: boolean;
}

const RESPONSE_MATCH_OPTIONS = [
  { label: `Validate ${ResponseMatchType.Authority} matches`, value: ResponseMatchType.Authority },
  { label: `Validate ${ResponseMatchType.Answer} matches`, value: ResponseMatchType.Answer },
  { label: `Validate ${ResponseMatchType.Additional} matches`, value: ResponseMatchType.Additional },
];

const DnsSettingsForm = ({ isEditor }: Props) => {
  const { spacing } = useTheme();

  const { register, control } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'settings.dns.validations',
  });

  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDNSSettings, setShowDNSSettings] = useState(false);
  return (
    <Container>
      <Collapse
        label="DNS settings"
        onToggle={() => setShowDNSSettings(!showDNSSettings)}
        isOpen={showDNSSettings}
        collapsible
      >
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
      <Collapse
        label="Validation"
        onToggle={() => setShowValidation(!showValidation)}
        isOpen={showValidation}
        collapsible
      >
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
              grid-gap: ${spacing.sm};
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
                  name={`settings.dns.validations[${index}].responseMatch`}
                  render={({ field }) => (
                    <Select {...field} options={RESPONSE_MATCH_OPTIONS} defaultValue={RESPONSE_MATCH_OPTIONS[0]} />
                  )}
                />
                <Input {...register(`settings.dns.validations[${index}].expression`)} placeholder="Type expression" />
                <div
                  className={css`
                    position: relative;
                    margin-top: -20px;
                    justify-self: center;
                  `}
                >
                  <Checkbox
                    {...register(`settings.dns.validations[${index}].inverted`)}
                    aria-label="dns-validation-inverted"
                  />
                </div>
                <IconButton name="minus-circle" onClick={() => remove(index)} />
              </Fragment>
            ))}
          </div>
        )}
        <Button
          onClick={() => append({ responseMatch: RESPONSE_MATCH_OPTIONS[0], expression: '', inverted: false })}
          type="button"
          variant="secondary"
          className={css`
            margin: ${spacing.sm} 0 ${spacing.md} 0;
          `}
          size="sm"
          disabled={!isEditor}
        >
          Add RegEx Validation
        </Button>
      </Collapse>
      <Collapse
        label="Advanced options"
        collapsible={true}
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
      >
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
