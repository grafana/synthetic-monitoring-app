import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Label, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { Probe } from 'types';
import { ProbeStatus } from 'components/ProbeCard/ProbeStatus';

export const ProbesList = ({
  title,
  probes,
  selectedProbes,
  onSelectionChange,
}: {
  title: string;
  probes: Probe[];
  selectedProbes: number[];
  onSelectionChange: (probes: number[]) => void;
}) => {
  const styles = useStyles2(getStyles);

  const handleToggleAll = () => {
    if (allProbesSelected) {
      onSelectionChange(selectedProbes.filter((id) => !probes.some((probe) => probe.id === id)));
      return;
    }
    onSelectionChange([
      ...selectedProbes,
      ...(probes.filter((probe) => !probe.deprecated).map((probe) => probe.id) as number[]),
    ]);
  };

  const handleToggleProbe = (probe: Probe) => {
    if (!probe.id || probe.deprecated) {
      return;
    }
    if (selectedProbes.includes(probe.id)) {
      onSelectionChange(selectedProbes.filter((p) => p !== probe.id));
      return;
    }
    onSelectionChange([...selectedProbes, probe.id]);
  };

  const allProbesSelected = useMemo(
    () => probes.every((probe) => selectedProbes.includes(probe.id as number)),
    [probes, selectedProbes]
  );

  return (
    <div className={styles.probesColumn}>
      <div className={styles.sectionHeader}>
        <Checkbox id={`header-${title}`} onClick={handleToggleAll} checked={allProbesSelected} />
        <Label htmlFor={`header-${title}`} className={styles.headerLabel}>
          {title} ({probes.length})
        </Label>
      </div>
      {probes.map((probe: Probe) => (
        <div key={probe.id} className={styles.container}>
          <Checkbox
            id={`probe-${probe.id}`}
            onClick={() => handleToggleProbe(probe)}
            checked={selectedProbes.includes(probe.id as number)}
          />
          <Label htmlFor={`probe-${probe.id}`} className={styles.columnLabel}>
            <ProbeStatus probe={probe} /> {probe.name}
          </Label>
        </div>
      ))}
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: `flex`,
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
    alignItems: 'center',
  }),

  probesColumn: css({
    minWidth: '250px',
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.fontWeightLight,
  }),

  sectionHeader: css({
    display: 'flex',
    border: `1px solid ${theme.colors.border.weak}`,
    backgroundColor: `${theme.colors.background.secondary}`,
    padding: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    gap: theme.spacing(1),
    verticalAlign: 'middle',
    alignItems: 'center',
  }),

  headerLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h5.fontSize,
    color: 'white',
  }),

  columnLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h6.fontSize,
  }),
});
