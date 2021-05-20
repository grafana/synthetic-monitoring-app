import React, { PureComponent } from 'react';
import { css } from '@emotion/css';
import { Button, HorizontalGroup, MultiSelect, ThemeContext, Field } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Probe } from 'types';

interface CheckProbesProps {
  probes: number[];
  availableProbes: Probe[];
  isEditor: boolean;
  onChange: (probes: number[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
  error?: string;
}

interface CheckProbesState {
  probes: number[];
  probeStr: string;
}

export default class CheckProbes extends PureComponent<CheckProbesProps, CheckProbesState> {
  state = {
    probes: this.props.probes || [],
    probeStr: this.props.probes.join(','),
  };

  onChange = (item: Array<SelectableValue<number>>) => {
    let probes: number[] = [];
    for (const p of item.values()) {
      if (p.value) {
        probes.push(p.value);
      }
    }
    const str = probes.join(',');
    this.setState({ probes: probes, probeStr: str }, this.onUpdate);
  };

  onUpdate = () => {
    this.props.onChange(this.state.probes);
  };

  onAllLocations = () => {
    let probes: number[] = [];
    for (const p of this.props.availableProbes) {
      if (p.id) {
        probes.push(p.id);
      }
    }
    const str = probes.join(',');
    this.setState({ probes: probes, probeStr: str }, this.onUpdate);
  };
  onClearLocations = () => {
    let probes: number[] = [];
    this.setState({ probes: probes, probeStr: '' }, this.onUpdate);
  };

  render() {
    const { probes } = this.state;
    const { availableProbes, isEditor, onBlur, invalid, error } = this.props;
    let options: SelectableValue[] = [];
    for (const p of availableProbes) {
      options.push({
        label: p.name,
        value: p.id,
        description: p.online ? 'Online' : 'Offline',
      });
    }
    let selectedProbes: SelectableValue[] = [];
    for (const p of probes) {
      let existing = options.find((item) => item.value === p);
      if (existing) {
        selectedProbes.push(existing);
      }
    }

    return (
      <ThemeContext.Consumer>
        {(theme) => (
          <>
            <Field
              label="Probe locations"
              description="Select one, multiple, or all probes where this target will be checked from."
              disabled={!isEditor}
              error={error}
              invalid={invalid}
            >
              <MultiSelect
                options={options}
                value={selectedProbes}
                onChange={this.onChange}
                disabled={!isEditor}
                closeMenuOnSelect={false}
                onBlur={onBlur}
              />
            </Field>
            <div
              className={css`
                margin-top: ${theme.spacing.sm};
                margin-bottom: ${theme.spacing.md};
              `}
            >
              <HorizontalGroup spacing="sm">
                <Button onClick={this.onAllLocations} disabled={!isEditor} variant="secondary" size="sm" type="button">
                  All&nbsp;&nbsp;
                </Button>
                <Button
                  onClick={this.onClearLocations}
                  disabled={!isEditor}
                  variant="secondary"
                  size="sm"
                  type="button"
                >
                  Clear
                </Button>
              </HorizontalGroup>
            </div>
          </>
        )}
      </ThemeContext.Consumer>
    );
  }
}
