import React, { PureComponent } from 'react';
import { css } from 'emotion';
import { Button, HorizontalGroup, MultiSelect, ThemeContext } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Probe } from 'types';
import * as Validation from 'validation';

interface CheckProbesProps {
  probes: number[];
  availableProbes: Probe[];
  isEditor: boolean;
  onUpdate: (probes: number[]) => void;
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
    this.props.onUpdate(this.state.probes);
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
    const { availableProbes, isEditor } = this.props;
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
      let existing = options.find(item => item.value === p);
      if (existing) {
        selectedProbes.push(existing);
      }
    }

    return (
      <ThemeContext.Consumer>
        {theme => (
          <div>
            <MultiSelect
              options={options}
              value={selectedProbes}
              onChange={this.onChange}
              disabled={!isEditor}
              invalid={!Validation.validateProbes(probes)}
              closeMenuOnSelect={false}
            />
            <div
              className={css`
                margin-top: ${theme.spacing.sm};
              `}
            >
              <HorizontalGroup spacing="sm">
                <Button onClick={this.onAllLocations} disabled={!isEditor} variant="secondary" size="sm">
                  All&nbsp;&nbsp;
                </Button>
                <Button onClick={this.onClearLocations} disabled={!isEditor} variant="secondary" size="sm" type="reset">
                  Clear
                </Button>
              </HorizontalGroup>
            </div>
          </div>
        )}
      </ThemeContext.Consumer>
    );
  }
}
