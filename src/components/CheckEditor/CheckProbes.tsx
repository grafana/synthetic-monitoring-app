import React, { useState, useCallback } from 'react';
import { css } from '@emotion/css';
import { Button, HorizontalGroup, MultiSelect, ThemeContext, Field } from '@grafana/ui';
import { SelectableValue } from '@grafana/data';
import { Probe } from 'types';

interface Props {
  probes: number[];
  availableProbes: Probe[];
  isEditor: boolean;
  onChange: (probes: number[]) => void;
  onBlur?: () => void;
  invalid?: boolean;
  error?: string;
}

const CheckProbes = ({ probes, availableProbes, isEditor, onChange, onBlur, invalid, error }: Props) => {
  const [currentProbes, setCurrentProbes] = useState<number[]>(probes);

  const onChangeSelect = useCallback(
    (items: Array<SelectableValue<number>>) => {
      const probes = items.map((p) => p.value && p.value) as number[];
      setCurrentProbes(probes);
      onChange(probes);
    },
    [onChange]
  );

  const onClearLocations = () => {
    setCurrentProbes([]);
    onChange([]);
  };

  const onAllLocations = () => {
    const probes = availableProbes.map((p) => p.id) as number[];
    setCurrentProbes(probes);
    onChange(probes);
  };

  const options = availableProbes.map((p) => {
    return {
      label: p.name,
      value: p.id,
      description: p.online ? 'Online' : 'Offline',
    };
  });

  const selectedProbes = options.filter((p) => currentProbes.includes(p.value as number));

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
              onChange={onChangeSelect}
              disabled={!isEditor}
              closeMenuOnSelect={false}
              onBlur={onBlur}
            />
          </Field>
          <div
            className={css`
              margin-top: ${theme.spacing(1)};
              margin-bottom: ${theme.spacing(2)};
            `}
          >
            <HorizontalGroup spacing="sm">
              <Button onClick={onAllLocations} disabled={!isEditor} variant="secondary" size="sm" type="button">
                All&nbsp;&nbsp;
              </Button>
              <Button onClick={onClearLocations} disabled={!isEditor} variant="secondary" size="sm" type="button">
                Clear
              </Button>
            </HorizontalGroup>
          </div>
        </>
      )}
    </ThemeContext.Consumer>
  );
};

export default CheckProbes;
