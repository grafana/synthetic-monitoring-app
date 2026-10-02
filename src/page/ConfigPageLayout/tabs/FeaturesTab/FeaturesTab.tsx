import React, { useMemo, useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Badge, Button, FilterInput, Stack, Switch, Text, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { getBrowserFlagOverride, OPEN_FEATURE_KEYS, setBrowserFlagOverride } from 'services/featureFlags';

// import { trackFeatureEnableCancelled, trackFeatureReset, trackFeatureToggled } from 'features/tracking/featuresEvents';
import { getUserPermissions } from 'data/permissions';
import { useIsFeatureEnabled } from 'hooks/useFeatureFlag';
import { ConfirmModal } from 'components/ConfirmModal';
import { ContactAdminAlert } from 'page/ContactAdminAlert';

import { ConfigContent } from '../../ConfigContent';
import { ORG_FEATURES, OrgFeature, STAGE_BADGE_COLORS, STAGE_LABELS } from './FeaturesTab.constants';

interface SwitchableFeature extends OrgFeature {
  key: string;
}

// Only OpenFeature-routed flags read the browser override, so unmapped features can't be switched here.
const SWITCHABLE_FEATURES: SwitchableFeature[] = ORG_FEATURES.flatMap((feature) => {
  const key = OPEN_FEATURE_KEYS[feature.name];
  return key ? [{ ...feature, key }] : [];
});

type Overrides = Record<string, boolean | undefined>;

function readOverrides(): Overrides {
  return Object.fromEntries(SWITCHABLE_FEATURES.map(({ key }) => [key, getBrowserFlagOverride(key)]));
}

export function FeaturesTab() {
  const { isAdmin } = getUserPermissions();
  const isFeatureEnabled = useIsFeatureEnabled();
  const styles = useStyles2(getStyles);

  const [overrides, setOverrides] = useState<Overrides>(readOverrides);
  const [search, setSearch] = useState('');
  const [pendingConfirm, setPendingConfirm] = useState<SwitchableFeature | null>(null);

  const visibleFeatures = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) {
      return SWITCHABLE_FEATURES;
    }

    return SWITCHABLE_FEATURES.filter(({ title, description }) =>
      `${title} ${description}`.toLowerCase().includes(query)
    );
  }, [search]);

  const applyOverride = (key: string, value: boolean | undefined) => {
    setBrowserFlagOverride(key, value);
    setOverrides((current) => ({ ...current, [key]: value }));
  };

  const toggleFeature = (feature: SwitchableFeature, enabled: boolean) => {
    // trackFeatureToggled({
    //   feature: feature.key,
    //   stage: feature.stage,
    //   enabled,
    //   enabled_by_grafana: isFeatureEnabled(feature.name) && overrides[feature.key] === undefined,
    // });
    applyOverride(feature.key, enabled);
  };

  const handleToggle = (feature: SwitchableFeature, enabled: boolean) => {
    if (enabled && feature.stage === 'experimental') {
      setPendingConfirm(feature);
      return;
    }

    toggleFeature(feature, enabled);
  };

  const handleReset = (feature: SwitchableFeature) => {
    // trackFeatureReset({ feature: feature.key, stage: feature.stage });
    applyOverride(feature.key, undefined);
  };

  return (
    <ConfigContent title="Features">
      <ConfigContent.Section>
        <Stack direction="column" gap={2}>
          <Text color="secondary">
            Try Synthetic Monitoring features that are not yet generally available. Changes apply only to this browser
            and take effect immediately.
          </Text>

          {!isAdmin && <ContactAdminAlert title="Only organization admins can change feature settings." />}

          <FilterInput placeholder="Search features" value={search} onChange={setSearch} />

          {visibleFeatures.length === 0 ? (
            <Stack direction="column" alignItems="flex-start" gap={1}>
              <Text color="secondary">No features match &quot;{search}&quot;.</Text>
              <Button variant="secondary" size="sm" onClick={() => setSearch('')}>
                Clear search
              </Button>
            </Stack>
          ) : (
            <ul className={styles.list} aria-label="Features">
              {visibleFeatures.map((feature) => {
                const override = overrides[feature.key];
                const isOverridden = override !== undefined;
                const checked = override ?? isFeatureEnabled(feature.name);
                const switchId = `feature-${feature.name}`;

                return (
                  <li key={feature.name} className={styles.row}>
                    <div className={styles.details}>
                      <Stack alignItems="center" gap={1} wrap="wrap">
                        <label htmlFor={switchId} className={styles.title}>
                          {feature.title}
                        </label>
                        <Badge text={STAGE_LABELS[feature.stage]} color={STAGE_BADGE_COLORS[feature.stage]} />
                        {isOverridden ? (
                          <Badge text="Overridden in this browser" color="purple" />
                        ) : (
                          checked && <Badge text="Enabled by Grafana" color="green" />
                        )}
                      </Stack>
                      <Text color="secondary" variant="bodySmall">
                        {feature.description}
                      </Text>
                    </div>
                    <Stack alignItems="center" gap={2}>
                      {isOverridden && (
                        <Button
                          variant="secondary"
                          fill="text"
                          size="sm"
                          icon="history"
                          disabled={!isAdmin}
                          aria-label={`Reset ${feature.title}`}
                          onClick={() => handleReset(feature)}
                        >
                          Reset
                        </Button>
                      )}
                      <Switch
                        id={switchId}
                        value={checked}
                        disabled={!isAdmin}
                        onChange={(event) => handleToggle(feature, event.currentTarget.checked)}
                      />
                    </Stack>
                  </li>
                );
              })}
            </ul>
          )}
        </Stack>
      </ConfigContent.Section>

      <ConfirmModal
        isOpen={pendingConfirm !== null}
        title={`Enable ${pendingConfirm?.title ?? 'feature'}?`}
        body="This feature is experimental. It may change, break or be removed."
        confirmText="Enable"
        onConfirm={() => {
          if (pendingConfirm) {
            toggleFeature(pendingConfirm, true);
          }
          setPendingConfirm(null);
        }}
        onDismiss={() => {
          // if (pendingConfirm) {
          //   trackFeatureEnableCancelled({ feature: pendingConfirm.key, stage: pendingConfirm.stage });
          // }
          setPendingConfirm(null);
        }}
      />
    </ConfigContent>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  list: css({
    listStyle: 'none',
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
  }),
  row: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing(2),
    padding: theme.spacing(1.5, 2),
    '&:not(:last-child)': {
      borderBottom: `1px solid ${theme.colors.border.weak}`,
    },
  }),
  details: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.5),
    minWidth: 0,
  }),
  title: css({
    fontWeight: theme.typography.fontWeightMedium,
    marginBottom: 0,
  }),
});
