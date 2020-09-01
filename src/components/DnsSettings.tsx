import React, { FC, ChangeEvent, useState } from 'react';
import { css } from 'emotion';
import { Collapse, Container, HorizontalGroup, Field, Select, MultiSelect, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, DnsSettings, DnsProtocol, DnsRecordType, DNSRRValidator, DnsResponseCodes } from 'types';
import DnsValidatorForm from './DnsValidatorForm';
import { DNS_RESPONSE_CODES, DNS_RECORD_TYPES, DNS_PROTOCOLS, IP_OPTIONS } from './constants';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
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

const DnsSettingsForm: FC<Props> = ({ settings, isEditor, onUpdate }) => {
  const values = {
    ...defaultValues,
    ...settings.dns,
  };

  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <Container>
      <HorizontalGroup>
        <Field label="Record Type" description="DNS record type to query for" disabled={!isEditor}>
          <Select
            value={values.recordType}
            options={DNS_RECORD_TYPES}
            onChange={(selected: SelectableValue<DnsRecordType>) => {
              const dns = getUpdatedSettings(values, {
                name: 'recordType',
                value: selected.value,
                fallbackValue: DnsRecordType.A,
              });
              onUpdate({ dns });
            }}
          />
        </Field>
        <Field label="Server" description="Address of server to query" disabled={!isEditor}>
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
              onUpdate({ dns });
            }}
          />
        </Field>
        <Field label="Protocol" description="Transport protocol to use" disabled={!isEditor}>
          <Select
            value={values.protocol}
            options={DNS_PROTOCOLS}
            onChange={selected => {
              const dns = getUpdatedSettings(values, {
                name: 'protocol',
                value: selected.value,
                fallbackValue: DnsProtocol.UDP,
              });
              onUpdate({ dns });
            }}
          />
        </Field>
        <Field label="Port" description="port on server to query" disabled={!isEditor}>
          <Input
            id="dns-settings-port"
            value={values.port}
            type="number"
            placeholder="port"
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              const dns = getUpdatedSettings(values, { name: 'port', value: e.target.value, fallbackValue: 53 });
              onUpdate({ dns });
            }}
          />
        </Field>
      </HorizontalGroup>
      <Collapse
        label="Validation"
        collapsible={true}
        onToggle={() => setShowValidation(!showValidation)}
        isOpen={showValidation}
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
                onUpdate({ dns });
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
            onChange={(validations: DNSRRValidator | undefined) => {
              const dns = getUpdatedSettings(values, { name: 'validateAnswerRRS', value: validations });
              onUpdate({ dns });
            }}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Authority"
            description="Validate entries in the Authority section of the DNS response"
            validations={values.validateAuthorityRRS}
            onChange={(validations: DNSRRValidator | undefined) => {
              const dns = getUpdatedSettings(values, { name: 'validateAuthorityRRS', value: validations });
              onUpdate({ dns });
            }}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Additional"
            description="Validate entries in the Additional section of the DNS response"
            validations={values.validateAdditionalRRS}
            onChange={(validations: DNSRRValidator | undefined) => {
              const dns = getUpdatedSettings(values, { name: 'validateAdditionalRRS', value: validations });
              onUpdate({ dns });
            }}
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
        <HorizontalGroup>
          <div>
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
                  onUpdate({ dns });
                }}
              />
            </Field>
          </div>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};

export default DnsSettingsForm;
