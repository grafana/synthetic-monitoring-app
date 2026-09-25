import React, { useMemo } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Checkbox, Icon, Label, Stack, Text, TextLink, Tooltip, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { CheckFormValues, FeatureName, Probe, ProbeWithMetadata } from 'types';
import { useFilteredK6Channels } from 'data/useK6Channels';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { DeprecationNotice } from 'components/DeprecationNotice/DeprecationNotice';
import { ProbeStatus } from 'components/ProbeCard/ProbeStatus';

import { isK6VersionUnknown } from './CheckProbes.utils';

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
  const { isEnabled: isVersionManagementEnabled } = useFeatureFlag(FeatureName.VersionManagement);
  const { getValues } = useFormContext<CheckFormValues>();

  const selectedChannel = useMemo(() => {
    return getValues('channels.k6.id');
  }, [getValues]);

  const { channels } = useFilteredK6Channels(Boolean(selectedChannel));

  const channelNameById = useMemo(
    () => Object.fromEntries(channels.map((channel) => [channel.id, channel.name])),
    [channels]
  );

  const isProbeCompatible = (probe: ProbeWithMetadata): boolean => {
    if (!isVersionManagementEnabled || !selectedChannel || !probe.k6Versions) {
      return true; // Default to compatible if feature is off or no channel selected
    }
    const version = probe.k6Versions[selectedChannel];
    return version !== null && version !== undefined;
  };

  const hasUnknownVersion = (probe: ProbeWithMetadata): boolean => {
    if (!isVersionManagementEnabled || !selectedChannel || !probe.k6Versions) {
      return false;
    }
    return isK6VersionUnknown(probe.k6Versions[selectedChannel]);
  };

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
          // Grafana's Checkbox sets the native indeterminate property when it is
          // enabled, but does not clear it when the prop changes back to false.
          // Clear it here so the header can transition from partial to checked.
          ref={(element) => {
            if (element) {
              element.indeterminate = someProbesSelected;
            }
          }}
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
        {probes.map((probe: ProbeWithMetadata) => {
          const isCompatible = isProbeCompatible(probe);
          const isUnknown = hasUnknownVersion(probe);
          const isSelected = selectedProbes.includes(probe.id!);
          const shouldDisable = disabled || (!isCompatible && !isSelected);
          const showIncompatibleStyling = !isCompatible && !isSelected;

          return (
            <div key={probe.id} className={`${styles.item} ${showIncompatibleStyling ? styles.incompatibleItem : ''}`}>
              <Checkbox
                data-testid={CHECKSTER_TEST_ID.form.inputs.probeCheckbox}
                id={`probe-${probe.id}`}
                onClick={() => handleToggleProbe(probe)}
                checked={isSelected}
                disabled={shouldDisable}
              />
              <Label htmlFor={`probe-${probe.id}`} data-testid={CHECKSTER_TEST_ID.form.inputs.probeLabel}>
                <div className={styles.columnLabel}>
                  <div className={`${styles.probeLabelContent} ${showIncompatibleStyling ? styles.incompatibleLabel : ''}`}>
                    <ProbeStatus probe={probe} />
                    {`${probe.displayName}${probe.countryCode ? `, ${probe.countryCode}` : ''} ${probe.provider ? `(${probe.provider})` : ''
                      }`}
                    {isVersionManagementEnabled && (!isCompatible || isUnknown) && (
                      <ProbeUnsupportedBadge
                        probe={probe}
                        isCompatible={isCompatible}
                        isUnknown={isUnknown}
                        channelNameById={channelNameById}
                      />
                    )}
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
                </div>
              </Label>
            </div>
          );
        })}
      </div>
    </div>
  );
};

function ProbeUnsupportedBadge({
  probe,
  isCompatible,
  isUnknown,
  channelNameById,
}: {
  probe: ProbeWithMetadata;
  isCompatible: boolean;
  isUnknown: boolean;
  channelNameById: Record<string, string>;
}) {
  const styles = useStyles2(getStyles);
  const versionState = isUnknown ? VERSION_STATE.unknown : VERSION_STATE.notSupported;
  const supportedChannels = getSupportedChannelNames(probe, channelNameById);

  return (
    <>
      <Badge text={versionState.text} color={versionState.color} className={styles.versionBadge} />
      <Tooltip
        content={
          <div>
            {!isCompatible && !isUnknown && (
              <div>
                {supportedChannels.length > 0
                  ? `This probe only supports these k6 channels: ${supportedChannels.join(', ')}.`
                  : 'This probe does not support any available k6 channel yet.'}
              </div>
            )}
            {isUnknown && (
              <div>
                {supportedChannels.length > 0
                  ? 'This probe has not reported its k6 version for this channel. Compatibility with the selected channel cannot be guaranteed.'
                  : 'This probe has not reported any k6 version information. Compatibility with the selected channel cannot be guaranteed.'}
              </div>
            )}
          </div>
        }
      >
        <span className={styles.k6IconWrapper}>
          <Icon name="info-circle" className={styles.infoIcon} />
        </span>
      </Tooltip>
    </>
  );
}

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
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    width: '100%',
  }),

  versionBadge: css({
    marginLeft: theme.spacing(0.5),
    verticalAlign: 'middle',
  }),

  k6IconWrapper: css({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    marginLeft: theme.spacing(0.25),
    verticalAlign: 'middle',
  }),

  infoIcon: css({
    fontSize: '14px',
    color: theme.colors.text.secondary,
    verticalAlign: 'middle',
  }),

  probeLabelContent: css({
    display: 'inline',
  }),

  incompatibleItem: css({
    opacity: 0.5,
  }),

  incompatibleLabel: css({
    color: theme.colors.text.disabled,
  }),
});

type BadgeColor = 'blue' | 'orange' | 'red';

const VERSION_STATE = {
  notSupported: { text: 'not supported', color: 'red' as BadgeColor },
  unknown: { text: 'version unknown', color: 'orange' as BadgeColor },
} as const;

function isKnownVersion(version: string | null): boolean {
  return version !== null && !isK6VersionUnknown(version);
}

function getSupportedChannelNames(probe: ProbeWithMetadata | Probe, channelNameById: Record<string, string>): string[] {
  if (!probe.k6Versions) {
    return [];
  }
  return Object.entries(probe.k6Versions)
    .filter(([, version]) => isKnownVersion(version))
    .map(([channelId]) => channelNameById[channelId] ?? channelId);
}
