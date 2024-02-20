import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Button, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';

type SelectableProbe = {
  name: Probe['name'];
  id: Probe['id'];
  region: Probe['region'];
  selected: boolean;
  disabled: boolean;
  tooltip?: string;
};

interface Props {
  probes: SelectableProbe[];
  onChange: (id: Probe['id']) => void;
  isRemoving: boolean;
}

interface RegionMapping {
  [key: string]: SelectableProbe[];
}

export const ProbesByRegion = ({ isRemoving, probes, onChange }: Props) => {
  const styles = useStyles2(getStyles);

  const probesByRegion = probes.reduce<RegionMapping>((acc, probe) => {
    const currentRegion = probe.region;

    if (typeof acc[currentRegion] === 'undefined') {
      acc[currentRegion] = [];
    }

    acc[currentRegion].push(probe);

    return acc;
  }, {});

  return (
    <div className={styles.probesWrapper}>
      <div>
        {Object.keys(probesByRegion).map((region: string) => {
          return (
            <React.Fragment key={region}>
              <h5>{region}</h5>
              <div className={styles.buttonGroup}>
                {probesByRegion[region].map(({ disabled, id, name, selected, tooltip }) => {
                  const variant = getVariant(selected, isRemoving);
                  const label = getName(selected, isRemoving, name);

                  return (
                    <Button
                      data-testid="probe-button"
                      key={id}
                      variant={variant}
                      disabled={disabled}
                      size="sm"
                      onClick={() => onChange(id)}
                      tooltip={tooltip}
                    >
                      {label}
                    </Button>
                  );
                })}
              </div>
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

function getVariant(selected: boolean, isRemoving: boolean) {
  if (selected) {
    if (isRemoving) {
      return 'destructive';
    }

    return 'primary';
  }

  return 'secondary';
}

function getName(selected: boolean, isRemoving: boolean, name: string) {
  if (selected && isRemoving) {
    return <del>{name}</del>;
  }

  return name;
}

const getStyles = (theme: GrafanaTheme2) => ({
  buttonGroup: css`
    margin: ${theme.spacing(2)};
    margin-left: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    width: 90%;
  `,
  probesWrapper: css`
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
  `,
});
