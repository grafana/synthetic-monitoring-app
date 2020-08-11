import React, { FC, ChangeEvent, useReducer, useEffect, useState } from 'react';
import { css } from 'emotion';
import { Collapse, Container, HorizontalGroup, Field, Select, MultiSelect, Input } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, DnsSettings, DnsProtocol, DnsRecordType, DNSRRValidator, DnsResponseCodes } from 'types';
import { IpOptions } from './utils';
import DnsValidatorForm from './DnsValidatorForm';
import { DNS_RESPONSE_CODES, DNS_RECORD_TYPES, DNS_PROTOCOLS } from './constants';

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

function dnsSettingsReducer(state: DnsSettings, action: Action) {
  return {
    ...state,
    [action.name]: action.value ?? action.fallbackValue,
  };
}

const DnsSettingsForm: FC<Props> = ({ settings, isEditor, onUpdate }) => {
  const initialValues = {
    ...defaultValues,
    ...settings.dns,
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
            options={DNS_RECORD_TYPES}
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
            options={DNS_PROTOCOLS}
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
              options={DNS_RESPONSE_CODES}
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
