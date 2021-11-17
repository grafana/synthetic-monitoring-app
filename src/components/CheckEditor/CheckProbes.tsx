import React, { useState, useCallback, forwardRef } from 'react';
import { css } from '@emotion/css';
import { Button, HorizontalGroup, MultiSelect, ThemeContext, Field } from '@grafana/ui';
import { SelectableValue, AppEvents } from '@grafana/data';
import appEvents from 'grafana/app/core/app_events';
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

const CheckProbes = forwardRef(
  ({ probes, availableProbes, isEditor, onChange, onBlur, invalid, error }: Props, ref) => {
    const [currentProbes, setCurrentProbes] = useState<number[]>(probes);

    const onChangeSelect = useCallback(
      (items: Array<SelectableValue<number>>) => {
        // On adding a new probe, check deprecation status
        if (currentProbes.length < items.length) {
          const newItem = items.find((item) => !currentProbes.includes(item.value as number));
          // Prevent adding to list if probe is deprecated
          if (newItem && newItem.deprecated) {
            appEvents.emit(AppEvents.alertWarning, [`Deprecated probes cannot be added to checks`]);
            return;
          }
        }
        const probes = items.map((p) => p.value && p.value) as number[];
        setCurrentProbes(probes);
        onChange(probes);
      },
      [onChange, currentProbes]
    );

    const onClearLocations = () => {
      setCurrentProbes([]);
      onChange([]);
    };

    const onAllLocations = () => {
      const probes = availableProbes.filter((p) => !p.deprecated).map((p) => p.id) as number[];
      setCurrentProbes(probes);
      onChange(probes);
    };

    const options = availableProbes.map((p) => {
      return {
        label: p.deprecated ? `${p.name} (deprecated)` : p.name,
        value: p.id,
        description: p.online ? 'Online' : 'Offline',
        deprecated: p.deprecated,
      };
    });

    const selectedProbes = options.filter((p) => currentProbes.includes(p.value as number));

    return (
      <ThemeContext.Consumer>
        {(theme) => (
          <>
            <Field
              label="Probe locations"
              description="Select one, multiple, or all probes where this target will be checked from. Deprecated probes can be removed, but they cannot be added."
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
  }
);

CheckProbes.displayName = 'CheckProbes';

export default CheckProbes;
