import React, { FC, ChangeEvent, useState, useCallback, useMemo } from 'react';
import { css } from 'emotion';
import { Collapse, Container, HorizontalGroup, Field, Select, MultiSelect, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import {
  IpVersion,
  Label,
  Settings,
  DnsSettings,
  DnsProtocol,
  DnsRecordType,
  DNSRRValidator,
  DnsResponseCodes,
} from 'types';
import DnsValidatorForm from './DnsValidatorForm';
import { LabelField } from './LabelField';
import { DNS_RESPONSE_CODES, DNS_RECORD_TYPES, DNS_PROTOCOLS, IP_OPTIONS } from './constants';

interface Props {
  settings: Settings;
  isEditor: boolean;
  labels: Label[];
  onUpdate: (settings: Settings, labels: Label[]) => void;
}

const defaultValues = {
  recordType: DnsRecordType.A,
  server: '8.8.8.8',
  ipVersion: IpVersion.V4,
  protocol: DnsProtocol.UDP,
  port: 53,
  validRCodes: [DnsResponseCodes.NOERROR],
  validateAnswerRRS: { failIfMatchesRegexp: [], failIfNotMatchesRegexp: [] },
  validateAuthorityRRS: { failIfMatchesRegexp: [], failIfNotMatchesRegexp: [] },
  validateAdditionalRRS: { failIfMatchesRegexp: [], failIfNotMatchesRegexp: [] },
};

interface Action {
  name: keyof DnsSettings;
  value: any;
  fallbackValue?: any;
}

function getUpdatedSettings(settings: DnsSettings, action: Action): DnsSettings {
  return {
    ...settings,
    [action.name]: action.value ?? action.fallbackValue,
  };
}

const DnsSettingsForm: FC<Props> = ({ settings, isEditor, labels, onUpdate }) => {
  const values = useMemo(
    () => ({
      ...defaultValues,
      ...settings.dns,
    }),
    [settings.dns]
  );

  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDNSSettings, setShowDNSSettings] = useState(false);
  const onValidateAnswerChange = useCallback(
    (validations: DNSRRValidator | undefined) => {
      const dns = getUpdatedSettings(values, { name: 'validateAnswerRRS', value: validations });
      onUpdate({ dns }, labels);
    },
    // eslint-disable-next-line
    []
  );

  const onValidateAuthorityChange = useCallback(
    (validations: DNSRRValidator | undefined) => {
      const dns = getUpdatedSettings(values, { name: 'validateAuthorityRRS', value: validations });
      onUpdate({ dns }, labels);
    },
    // eslint-disable-next-line
    []
  );

  const onValidateAdditionalChange = useCallback(
    (validations: DNSRRValidator | undefined) => {
      const dns = getUpdatedSettings(values, { name: 'validateAdditionalRRS', value: validations });
      onUpdate({ dns }, labels);
    },
    // eslint-disable-next-line
    []
  );

  return (
    <Container>
      <Collapse
        label="DNS Settings"
        onToggle={() => setShowDNSSettings(!showDNSSettings)}
        isOpen={showDNSSettings}
        collapsible
      >
        <div
          className={css`
            max-width: 240px;
          `}
        >
          <Field label="Record Type" disabled={!isEditor}>
            <Select
              value={values.recordType}
              options={DNS_RECORD_TYPES}
              onChange={(selected: SelectableValue<DnsRecordType>) => {
                const dns = getUpdatedSettings(values, {
                  name: 'recordType',
                  value: selected.value,
                  fallbackValue: DnsRecordType.A,
                });
                onUpdate({ dns }, labels);
              }}
            />
          </Field>
          <Field label="Server" disabled={!isEditor}>
            <Input
              id="dns-settings-server-address"
              value={values.server}
              type="text"
              placeholder="server"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const dns = getUpdatedSettings(values, {
                  name: 'server',
                  value: e.target.value,
                  fallbackValue: '8.8.8.8',
                });
                onUpdate({ dns }, labels);
              }}
            />
          </Field>
          <Field label="Protocol" disabled={!isEditor}>
            <Select
              value={values.protocol}
              options={DNS_PROTOCOLS}
              onChange={selected => {
                const dns = getUpdatedSettings(values, {
                  name: 'protocol',
                  value: selected.value,
                  fallbackValue: DnsProtocol.UDP,
                });
                onUpdate({ dns }, labels);
              }}
            />
          </Field>
          <Field label="Port" disabled={!isEditor}>
            <Input
              id="dns-settings-port"
              value={values.port}
              type="number"
              placeholder="port"
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                const dns = getUpdatedSettings(values, { name: 'port', value: e.target.value, fallbackValue: 53 });
                onUpdate({ dns }, labels);
              }}
            />
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
          <Field label="Valid Response Codes" description="List of valid response codes" disabled={!isEditor}>
            <MultiSelect
              value={values.validRCodes}
              options={DNS_RESPONSE_CODES}
              onChange={responseCodes => {
                const dns = getUpdatedSettings(values, {
                  name: 'validRCodes',
                  value: responseCodes.map(code => code.value),
                  fallbackValue: [DnsResponseCodes.NOERROR],
                });
                onUpdate({ dns }, labels);
              }}
            />
          </Field>
        </HorizontalGroup>
        <div
          className={css`
            display: grid;
            grid-template-columns: auto auto;
            grid-column-gap: 0.5rem;
          `}
        >
          <DnsValidatorForm
            name="Validate Answer"
            description="Validate entries in the Answer section of the DNS response"
            validations={values.validateAnswerRRS}
            onChange={onValidateAnswerChange}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Authority"
            description="Validate entries in the Authority section of the DNS response"
            validations={values.validateAuthorityRRS}
            onChange={onValidateAuthorityChange}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Additional"
            description="Validate entries in the Additional section of the DNS response"
            validations={values.validateAdditionalRRS}
            onChange={onValidateAdditionalChange}
            isEditor={isEditor}
          />
        </div>
      </Collapse>
      <Collapse
        label="Advanced Options"
        collapsible={true}
        onToggle={() => setShowAdvanced(!showAdvanced)}
        isOpen={showAdvanced}
      >
        <LabelField
          isEditor={isEditor}
          labels={labels}
          onLabelsUpdate={labelsValue => {
            onUpdate({ dns: values }, labelsValue);
          }}
        />
        <HorizontalGroup>
          <Field label="IP Version" description="The IP protocol of the ICMP request" disabled={!isEditor}>
            <Select
              value={values.ipVersion}
              options={IP_OPTIONS}
              onChange={selected => {
                const dns = getUpdatedSettings(values, {
                  name: 'ipVersion',
                  value: selected.value,
                  fallbackValue: IpVersion.Any,
                });
                onUpdate({ dns }, labels);
              }}
            />
          </Field>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};

export default DnsSettingsForm;
