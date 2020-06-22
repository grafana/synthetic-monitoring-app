import React, { PureComponent } from 'react';
import { Collapse, Container, HorizontalGroup, Field, Select, MultiSelect, Input, List, IconButton } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { IpVersion, Settings, DnsSettings, DnsProtocol, DnsRecordType, DNSRRValidator } from 'types';
import { FormLabel, IpOptions } from './utils';

interface Props {
  settings: Settings;
  isEditor: boolean;
  onUpdate: (settings: Settings) => void;
}

interface State extends DnsSettings {
  showAdvanced: boolean;
  showValidation: boolean;
}

export class DnsSettingsForm extends PureComponent<Props, State> {
  state: State = {
    showValidation: false,
    showAdvanced: false,
    recordType: this.props.settings!.dns?.recordType || DnsRecordType.A,
    server: this.props.settings!.dns?.server || '8.8.8.8',
    ipVersion: this.props.settings!.dns?.ipVersion || IpVersion.V4,
    protocol: this.props.settings!.dns?.protocol || DnsProtocol.UDP,
    port: this.props.settings!.dns?.port || 53,

    // validation
    validRCodes: this.props.settings!.dns?.validRCodes || [],
    validateAnswerRRS: this.props.settings!.dns?.validateAnswerRRS,
    validateAuthorityRRS: this.props.settings!.dns?.validateAuthorityRRS,
    validateAdditionalRRS: this.props.settings!.dns?.validateAdditionalRRS,
  };

  onUpdate = () => {
    const settings = this.state as DnsSettings;
    this.props.onUpdate({
      dns: settings,
    });
  };

  onIpVersionChange = (value: SelectableValue<IpVersion>) => {
    this.setState({ ipVersion: value.value || IpVersion.Any }, this.onUpdate);
  };

  onProtocolChange = (value: SelectableValue<DnsProtocol>) => {
    this.setState({ protocol: value.value || DnsProtocol.UDP }, this.onUpdate);
  };

  onPortChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ port: event.target.valueAsNumber || 53 }, this.onUpdate);
  };

  onServerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ server: event.target.value }, this.onUpdate);
  };

  onRecordTypeChange = (value: SelectableValue<DnsRecordType>) => {
    this.setState({ recordType: value.value || DnsRecordType.A }, this.onUpdate);
  };

  onShowAdvanced = (isOpen: boolean) => {
    this.setState({ showAdvanced: !this.state.showAdvanced });
  };

  onShowValidation = (isOpen: boolean) => {
    this.setState({ showValidation: !this.state.showValidation });
  };

  onValidRCodesChange = (item: Array<SelectableValue<string>>) => {
    let validRCodes: string[] = [];
    for (const p of item.values()) {
      if (p.value) {
        validRCodes.push(p.value);
      }
    }
    this.setState({ validRCodes }, this.onUpdate);
  };

  onValidateAnswerChange = (validations: DNSRRValidator | undefined) => {
    console.log('validateAnswer update.', validations);
    if (!validations) {
      this.setState({ validateAnswerRRS: undefined }, this.onUpdate);
      return;
    }
    const validateAnswerRRS = {
      failIfMatchesRegexp: validations.failIfMatchesRegexp,
      failIfNotMatchesRegexp: validations.failIfNotMatchesRegexp,
    };
    this.setState({ validateAnswerRRS }, this.onUpdate);
  };

  onValidateAuthorityChange = (validations: DNSRRValidator | undefined) => {
    if (!validations) {
      this.setState({ validateAuthorityRRS: undefined }, this.onUpdate);
      return;
    }
    const validateAuthorityRRS = {
      failIfMatchesRegexp: validations.failIfMatchesRegexp,
      failIfNotMatchesRegexp: validations.failIfNotMatchesRegexp,
    };
    this.setState({ validateAuthorityRRS }, this.onUpdate);
  };

  onValidateAdditionalChange = (validations: DNSRRValidator | undefined) => {
    if (!validations) {
      this.setState({ validateAdditionalRRS: undefined }, this.onUpdate);
      return;
    }
    const validateAdditionalRRS = {
      failIfMatchesRegexp: validations.failIfMatchesRegexp,
      failIfNotMatchesRegexp: validations.failIfNotMatchesRegexp,
    };
    this.setState({ validateAdditionalRRS }, this.onUpdate);
  };

  render() {
    const {
      ipVersion,
      recordType,
      server,
      port,
      protocol,
      showAdvanced,
      showValidation,
      validRCodes,
      validateAnswerRRS,
      validateAuthorityRRS,
      validateAdditionalRRS,
    } = this.state;
    const { isEditor } = this.props;

    const recordTypes = [
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
    const protocols = [
      {
        label: DnsProtocol.UDP,
        value: DnsProtocol.UDP,
      },
      {
        label: DnsProtocol.TCP,
        value: DnsProtocol.TCP,
      },
    ];
    const rCodes = [
      {
        label: 'NOERROR',
        value: 'NOERROR',
      },
    ];
    return (
      <Container>
        <HorizontalGroup>
          <Field
            label={<FormLabel name="Record Type" description="DNS record type to query for" />}
            disabled={!isEditor}
          >
            <Select value={recordType} options={recordTypes} onChange={this.onRecordTypeChange} />
          </Field>
          <Field label={<FormLabel name="Server" description="Address of server to query" />} disabled={!isEditor}>
            <Input value={server} type="text" placeholder="server" onChange={this.onServerChange} />
          </Field>
          <Field label={<FormLabel name="Protocol" description="Transport protocol to use" />} disabled={!isEditor}>
            <Select value={protocol} options={protocols} onChange={this.onProtocolChange} />
          </Field>
          <Field label={<FormLabel name="Port" description="port on server to query" />} disabled={!isEditor}>
            <Input value={port} type="number" placeholder="port" onChange={this.onPortChange} />
          </Field>
        </HorizontalGroup>
        <Collapse label="Validation" collapsible={true} onToggle={this.onShowValidation} isOpen={showValidation}>
          <HorizontalGroup>
            <Field
              label={<FormLabel name="Valid Response Codes" description="List of valid response codes" />}
              disabled={!isEditor}
            >
              <MultiSelect value={validRCodes} options={rCodes} onChange={this.onValidRCodesChange} />
            </Field>
          </HorizontalGroup>
          <DnsValidatorForm
            name="Validate Answer"
            description="Validate entries in the Answer section of the DNS response"
            validations={validateAnswerRRS}
            onChange={this.onValidateAnswerChange}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Authority"
            description="Validate entries in the Authority section of the DNS response"
            validations={validateAuthorityRRS}
            onChange={this.onValidateAuthorityChange}
            isEditor={isEditor}
          />
          <DnsValidatorForm
            name="Validate Additional"
            description="Validate entries in the Additional section of the DNS response"
            validations={validateAdditionalRRS}
            onChange={this.onValidateAdditionalChange}
            isEditor={isEditor}
          />
        </Collapse>
        <Collapse label="Advanced Options" collapsible={true} onToggle={this.onShowAdvanced} isOpen={showAdvanced}>
          <HorizontalGroup>
            <div>
              <Field
                label={<FormLabel name="IP Version" description="The IP protocol of the ICMP request" />}
                disabled={!isEditor}
              >
                <Select value={ipVersion} options={IpOptions} onChange={this.onIpVersionChange} />
              </Field>
            </div>
          </HorizontalGroup>
        </Collapse>
      </Container>
    );
  }
}

interface DnsValidatorProps {
  validations: DNSRRValidator | undefined;
  name: string;
  description: string;
  isEditor: boolean;
  onChange: (validations: DNSRRValidator | undefined) => void;
}

interface DnsValidatorState extends DNSRRValidator {}

export class DnsValidatorForm extends PureComponent<DnsValidatorProps, DnsValidatorState> {
  state = {
    failIfMatchesRegexp: this.props.validations?.failIfMatchesRegexp || [],
    failIfNotMatchesRegexp: this.props.validations?.failIfNotMatchesRegexp || [],
  };

  onUpdate = () => {
    const validations: DNSRRValidator = {
      failIfMatchesRegexp: this.state.failIfMatchesRegexp,
      failIfNotMatchesRegexp: this.state.failIfNotMatchesRegexp,
    };
    this.props.onChange(validations);
  };

  onFailIfMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let failIfMatchesRegexp: string[] = [];
    this.state.failIfMatchesRegexp.forEach((v, i) => {
      if (i === index) {
        failIfMatchesRegexp.push(event.target.value);
      } else {
        failIfMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfMatchesRegexp }, this.onUpdate);
  };

  onFailIfNotMatchesRegexpChange = (index: number) => (event: React.ChangeEvent<HTMLInputElement>) => {
    let failIfNotMatchesRegexp: string[] = [];
    this.state.failIfNotMatchesRegexp.forEach((v, i) => {
      if (i === index) {
        failIfNotMatchesRegexp.push(event.target.value);
      } else {
        failIfNotMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfNotMatchesRegexp }, this.onUpdate);
  };

  onFailIfMatchesRegexpDelete = (index: number) => () => {
    let failIfMatchesRegexp: string[] = [];
    this.state.failIfMatchesRegexp?.forEach((v, i) => {
      if (i !== index) {
        failIfMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfMatchesRegexp }, this.onUpdate);
  };

  onFailIfNotMatchesRegexpDelete = (index: number) => () => {
    let failIfNotMatchesRegexp: string[] = [];
    this.state.failIfNotMatchesRegexp?.forEach((v, i) => {
      if (i !== index) {
        failIfNotMatchesRegexp.push(v);
      }
    });
    this.setState({ failIfNotMatchesRegexp }, this.onUpdate);
  };

  onFailIfMatchesRegexpAdd = () => {
    let failIfMatchesRegexp: string[] = [];
    this.state.failIfMatchesRegexp.forEach(v => {
      failIfMatchesRegexp.push(v);
    });
    failIfMatchesRegexp.push('');
    this.setState({ failIfMatchesRegexp }, this.onUpdate);
  };

  onFailIfNotMatchesRegexpAdd = () => {
    let failIfNotMatchesRegexp: string[] = [];
    this.state.failIfNotMatchesRegexp.forEach(v => {
      failIfNotMatchesRegexp.push(v);
    });
    failIfNotMatchesRegexp.push('');
    this.setState({ failIfNotMatchesRegexp }, this.onUpdate);
  };

  render() {
    const { failIfMatchesRegexp, failIfNotMatchesRegexp } = this.state;
    const { isEditor, name, description } = this.props;

    return (
      <Container>
        <HorizontalGroup>
          <Field
            label={<FormLabel name={name + ' matches'} description={description + ' match'} />}
            disabled={!isEditor}
          >
            <Container>
              <List
                items={failIfMatchesRegexp}
                renderItem={(item, index) => (
                  <HorizontalGroup>
                    <Input
                      type="text"
                      placeholder="regexp"
                      value={item}
                      onChange={this.onFailIfMatchesRegexpChange(index)}
                      disabled={!isEditor}
                    />
                    <IconButton
                      name="minus-circle"
                      onClick={this.onFailIfMatchesRegexpDelete(index)}
                      disabled={!isEditor}
                    />
                  </HorizontalGroup>
                )}
              />
              <IconButton name="plus-circle" onClick={this.onFailIfMatchesRegexpAdd} disabled={!isEditor} />
            </Container>
          </Field>
          <Field
            label={<FormLabel name={name + " doesn't match"} description={description + " don't match"} />}
            disabled={!isEditor}
          >
            <Container>
              <List
                items={failIfNotMatchesRegexp}
                renderItem={(item, index) => (
                  <HorizontalGroup>
                    <Input
                      type="text"
                      placeholder="regexp"
                      value={item}
                      onChange={this.onFailIfNotMatchesRegexpChange(index)}
                      disabled={!isEditor}
                    />
                    <IconButton
                      name="minus-circle"
                      onClick={this.onFailIfNotMatchesRegexpDelete(index)}
                      disabled={!isEditor}
                    />
                  </HorizontalGroup>
                )}
              />
              <IconButton name="plus-circle" onClick={this.onFailIfNotMatchesRegexpAdd} disabled={!isEditor} />
            </Container>
          </Field>
        </HorizontalGroup>
      </Container>
    );
  }
}
