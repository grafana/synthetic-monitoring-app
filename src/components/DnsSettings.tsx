import React, { FC, ChangeEvent, useReducer, useEffect, useState } from 'react';
import { css } from 'emotion';
import { Collapse, Container, HorizontalGroup, Field, Select, MultiSelect, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, DnsSettings, DnsProtocol, DnsRecordType, DNSRRValidator, DnsResponseCodes } from 'types';
import { IpOptions } from './utils';
import DnsValidatorForm from './DnsValidatorForm';
import { enumToStringArray } from 'utils';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

const RESPONSE_CODES = enumToStringArray(DnsResponseCodes).map(responseCode => ({
  label: responseCode,
  value: responseCode,
}));

const RECORD_TYPES = [
  {
    label: DnsRecordType.A,
    value: DnsRecordType.A,
  },
  {
    label: DnsRecordType.AAAA,
    value: DnsRecordType.AAAA,
  },
  {
    label: DnsRecordType.CNAME,
    value: DnsRecordType.CNAME,
  },
  {
    label: DnsRecordType.MX,
    value: DnsRecordType.MX,
  },
  {
    label: DnsRecordType.NS,
    value: DnsRecordType.NS,
  },
  {
    label: DnsRecordType.SOA,
    value: DnsRecordType.SOA,
  },
  {
    label: DnsRecordType.TXT,
    value: DnsRecordType.TXT,
  },
  {
    label: DnsRecordType.PTR,
    value: DnsRecordType.PTR,
  },
  {
    label: DnsRecordType.SRV,
    value: DnsRecordType.SRV,
  },
];

const PROTOCOLS = [
  {
    label: DnsProtocol.UDP,
    value: DnsProtocol.UDP,
  },
  {
    label: DnsProtocol.TCP,
    value: DnsProtocol.TCP,
  },
];

interface Action {
  name: keyof DnsSettings;
  value: any;
  fallbackValue?: any;
}

function dnsSettingsReducer(state: DnsSettings, action: Action) {
  return {
    ...state,
    [action.name]: action.value ?? action.fallbackValue,
  };
}

const DnsSettingsForm: FC<Props> = ({ settings, isEditor, onUpdate }) => {
  const initialValues = {
    recordType: settings.dns?.recordType ?? DnsRecordType.A,
    server: settings!.dns?.server ?? '8.8.8.8',
    ipVersion: settings!.dns?.ipVersion ?? IpVersion.V4,
    protocol: settings!.dns?.protocol ?? DnsProtocol.UDP,
    port: settings!.dns?.port ?? 53,

    // validation
    validRCodes: settings!.dns?.validRCodes ?? [DnsResponseCodes.NOERROR],
    validateAnswerRRS: settings!.dns?.validateAnswerRRS ?? { failIfMatchesRegexp: [], failIfNotMatchesRegexp: [] },
    validateAuthorityRRS: settings!.dns?.validateAuthorityRRS ?? {
      failIfMatchesRegexp: [],
      failIfNotMatchesRegexp: [],
    },
    validateAdditionalRRS: settings!.dns?.validateAdditionalRRS ?? {
      failIfMatchesRegexp: [],
      failIfNotMatchesRegexp: [],
    },
  };
  const [dnsSettings, dispatch] = useReducer(dnsSettingsReducer, initialValues);
  const [showValidation, setShowValidation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    onUpdate({ dns: dnsSettings });
  }, [dnsSettings]);

  return (
    <Container>
      <HorizontalGroup>
        <Field label="Record Type" description="DNS record type to query for" disabled={!isEditor}>
          <Select
            value={dnsSettings.recordType}
            options={RECORD_TYPES}
            onChange={(selected: SelectableValue<DnsRecordType>) =>
              dispatch({
                name: 'recordType',
                value: selected.value,
                fallbackValue: DnsRecordType.A,
              })
            }
          />
        </Field>
        <Field label="Server" description="Address of server to query" disabled={!isEditor}>
          <Input
            id="dns-settings-server-address"
            value={dnsSettings.server}
            type="text"
            placeholder="server"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              dispatch({ name: 'server', value: e.target.value, fallbackValue: '8.8.8.8' })
            }
          />
        </Field>
        <Field label="Protocol" description="Transport protocol to use" disabled={!isEditor}>
          <Select
            value={dnsSettings.protocol}
            options={PROTOCOLS}
            onChange={selected => dispatch({ name: 'protocol', value: selected.value, fallbackValue: DnsProtocol.UDP })}
          />
        </Field>
        <Field label="Port" description="port on server to query" disabled={!isEditor}>
          <Input
            id="dns-settings-port"
            value={dnsSettings.port}
            type="number"
            placeholder="port"
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              dispatch({ name: 'port', value: e.target.value, fallbackValue: 53 })
            }
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
              value={dnsSettings.validRCodes}
              options={RESPONSE_CODES}
              onChange={value =>
                dispatch({
                  name: 'validRCodes',
                  value,
                  fallbackValue: [DnsResponseCodes.NOERROR],
                })
              }
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
            validations={dnsSettings.validateAnswerRRS}
            onChange={(validations: DNSRRValidator | undefined) =>
              dispatch({ name: 'validateAnswerRRS', value: validations })
            }
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Authority"
            description="Validate entries in the Authority section of the DNS response"
            validations={dnsSettings.validateAuthorityRRS}
            onChange={(validations: DNSRRValidator | undefined) => {
              dispatch({ name: 'validateAuthorityRRS', value: validations });
            }}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Additional"
            description="Validate entries in the Additional section of the DNS response"
            validations={dnsSettings.validateAdditionalRRS}
            onChange={(validations: DNSRRValidator | undefined) =>
              dispatch({ name: 'validateAdditionalRRS', value: validations })
            }
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
                value={dnsSettings.ipVersion}
                options={IpOptions}
                onChange={selected =>
                  dispatch({ name: 'ipVersion', value: selected.value, fallbackValue: IpVersion.Any })
                }
              />
            </Field>
          </div>
        </HorizontalGroup>
      </Collapse>
    </Container>
  );
};

export default DnsSettingsForm;
