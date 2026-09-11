import React, { useState } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Alert, Collapse, Space, Tag, Text, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { type Check } from 'types';

import { BlockingChecksList } from './BlockingChecksList';

interface ImpactedChecksWarningProps {
  checks: Check[];
  systemLabels: string[];
  checksError?: boolean;
}

// Surfaces which reserved-name collisions already exist before the admin
// attempts a transition, instead of only after it 409s. Computed entirely
// client-side from data already on the page (no extra API call). The
// breakdown lives in its own Collapse (not inside the Alert body) so a
// tenant with many colliding labels doesn't turn the warning into a wall of
// text — the Alert states the headline, the Collapse holds the detail.
export function ImpactedChecksWarning({ checks, systemLabels, checksError }: ImpactedChecksWarningProps) {
  const styles = useStyles2(getStyles);
  const [isOpen, setIsOpen] = useState(false);

  // A failed check-list fetch leaves `checks` empty, which looks identical to
  // a confirmed "no collisions" result below — surface the failure instead of
  // silently reporting a false negative.
  if (checksError) {
    return (
      <div data-testid="impacted-checks-warning-error">
        <Alert severity="warning" title="Couldn't verify whether any checks use reserved label names">
          <Text>The check list failed to load, so this can&apos;t confirm whether this transition will be blocked.</Text>
        </Alert>
        <Space v={2} />
      </div>
    );
  }

  const impactedLabels = systemLabels.filter((name) => checks.some((check) => check.labels.some((l) => l.name === name)));

  if (impactedLabels.length === 0) {
    return null;
  }

  const impactedCheckCount = new Set(
    checks.filter((check) => check.labels.some((l) => impactedLabels.includes(l.name))).map((check) => check.id)
  ).size;

  return (
    <div data-testid="impacted-checks-warning">
      <Alert
        severity="warning"
        title={`${impactedCheckCount} check${impactedCheckCount === 1 ? '' : 's'} use reserved label names`}
      >
        <Text>
          There are {impactedCheckCount} check{impactedCheckCount === 1 ? '' : 's'} that currently use label names
          reserved by the migration and will block this transition until renamed.
        </Text>
      </Alert>
      <Collapse
        label={`Impacted label${impactedLabels.length === 1 ? '' : 's'} (${impactedLabels.length})`}
        isOpen={isOpen}
        onToggle={() => setIsOpen((v) => !v)}
      >
        {impactedLabels.map((label, i) => (
          <div key={label} className={cx(styles.row, { [styles.lastRow]: i === impactedLabels.length - 1 })}>
            <Tag name={label} colorIndex={9} className={styles.labelTag} />
            <BlockingChecksList label={label} checks={checks} />
          </div>
        ))}
      </Collapse>
      <Space v={2} />
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  row: css`
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: ${theme.spacing(1.5)};
    padding: ${theme.spacing(1)} 0;
    border-bottom: 1px solid ${theme.colors.border.weak};
  `,
  lastRow: css`
    border-bottom: none;
  `,
  labelTag: css`
    font-family: ${theme.typography.fontFamilyMonospace};
    flex-shrink: 0;
  `,
});
