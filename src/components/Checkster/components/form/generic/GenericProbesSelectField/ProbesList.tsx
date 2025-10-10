import React, { useMemo } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Checkbox, Label, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ProbeWithMetadata } from 'types';
import { DeprecationNotice } from 'components/DeprecationNotice/DeprecationNotice';
import { ProbeStatus } from 'components/ProbeCard/ProbeStatus';

export const ProbesList = ({
  title,
  probes,
  selectedProbes,
  onSelectionChange,
  disabled,
}: {
  title: string;
  probes: ProbeWithMetadata[];
  selectedProbes: number[];
  onSelectionChange: (probes: number[]) => void;
  disabled?: boolean;
}) => {
  const styles = useStyles2(getStyles);

  const handleToggleAll = () => {
    if (allProbesSelected) {
      onSelectionChange(selectedProbes.filter((id) => !probes.some((probe) => probe.id === id)));
      return;
    }
    const selected = new Set([...selectedProbes, ...probes.map((probe) => probe.id!)]);
    onSelectionChange([...selected]);
  };

  const handleToggleProbe = (probe: ProbeWithMetadata) => {
    if (!probe.id) {
      return;
    }
    if (selectedProbes.includes(probe.id)) {
      onSelectionChange(selectedProbes.filter((p) => p !== probe.id));
      return;
    }
    onSelectionChange([...selectedProbes, probe.id]);
  };

  const probeIds = useMemo(() => probes.map((probe) => probe.id!), [probes]);
  const regionSelectedProbes = useMemo(
    () => selectedProbes.filter((probe) => probeIds.includes(probe)),
    [selectedProbes, probeIds]
  );

  const allProbesSelected = useMemo(
    () => probes.every((probe) => selectedProbes.includes(probe.id!)),
    [probes, selectedProbes]
  );

  const someProbesSelected = useMemo(
    () => probes.some((probe) => selectedProbes.includes(probe.id!)) && !allProbesSelected,
    [probes, selectedProbes, allProbesSelected]
  );

  return (
    <div className={styles.probesColumn}>
      <div className={styles.sectionHeader}>
        <Checkbox
          id={`header-${title}`}
          onClick={handleToggleAll}
          checked={allProbesSelected}
          indeterminate={someProbesSelected}
          disabled={disabled}
        />
        <Label htmlFor={`header-${title}`} className={styles.headerLabel}>
          <Stack>
            <Text>{`${title} (${regionSelectedProbes.length})`}</Text>
            {probes[0]?.longRegion && <span className={styles.probeRegionDescription}>{probes[0]?.longRegion}</span>}
          </Stack>
        </Label>
      </div>
      <div className={styles.probesList}>
        {probes.map((probe: ProbeWithMetadata) => (
          <div key={probe.id} className={styles.item}>
            <Checkbox
              id={`probe-${probe.id}`}
              onClick={() => handleToggleProbe(probe)}
              checked={selectedProbes.includes(probe.id!)}
              disabled={disabled}
            />
            <Label htmlFor={`probe-${probe.id}`}>
              <div className={styles.columnLabel}>
                <ProbeStatus probe={probe} />{' '}
                {`${probe.displayName}${probe.countryCode ? `, ${probe.countryCode}` : ''} ${
                  probe.provider ? `(${probe.provider})` : ''
                }`}
                {probe.deprecated && (
                  <DeprecationNotice
                    tooltipContent={
                      <div>
                        This probe is deprecated and will be removed soon. For more information{' '}
                        <TextLink
                          variant={'bodySmall'}
                          href="https://grafana.com/docs/grafana-cloud/whats-new/2025-01-14-launch-and-shutdown-dates-for-synthetics-probes-in-february-2025/"
                          external
                        >
                          click here.
                        </TextLink>
                      </div>
                    }
                  />
                )}
              </div>
            </Label>
          </div>
        ))}
      </div>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  item: css({
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    display: `flex`,
    gap: theme.spacing(1),
    marginLeft: theme.spacing(1),
    alignItems: 'center',
  }),

  probesColumn: css({
    fontSize: theme.typography.h6.fontSize,
    fontWeight: theme.typography.fontWeightLight,
  }),

  probeRegionDescription: css({
    color: theme.colors.text.secondary,
    fontSize: theme.typography.bodySmall.fontSize,
    paddingTop: '3px',
  }),

  probesList: css({
    display: 'flex',
    flexDirection: 'column',
    minWidth: '250px',
    maxWidth: '350px',
    maxHeight: '400px',
    overflowY: 'auto',
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
    color: theme.colors.text.primary,
  }),

  columnLabel: css({
    fontWeight: theme.typography.fontWeightLight,
    fontSize: theme.typography.h6.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    marginBottom: '0',
  }),
});
