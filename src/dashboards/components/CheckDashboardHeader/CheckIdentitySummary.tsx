import React, { ReactNode } from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';

export function CheckIdentitySummary({
  model,
  actions,
}: {
  model: CheckHeaderDefinitionModel;
  actions?: ReactNode;
}) {
  const theme = useTheme2();
  const styles = useStyles2(getStyles);
  const methodColor = model.qualifier?.getColor?.(theme);

  return (
    <section aria-label="Check identity" className={styles.container}>
      <div className={styles.titleRow}>
        <div className={styles.identityGroup}>
          <span aria-label="Check type" className={styles.typePill}>
            {model.typeLabel}
          </span>
          <div className={styles.identityText}>
            <Text variant="h1">{model.title}</Text>
            {model.target ? (
              <div
                aria-label={model.target.accessibleLabel}
                className={styles.target}
                data-testid="check-identity-metadata"
                title={model.target.value}
              >
                {model.qualifier ? (
                  <span className={styles.qualifier} style={methodColor ? { color: methodColor } : undefined}>
                    {model.qualifier.text}
                  </span>
                ) : null}
                <span className={styles.targetValue}>{model.target.value}</span>
              </div>
            ) : null}
          </div>
        </div>
        {actions ? <div className={styles.actions}>{actions}</div> : null}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({ display: 'flex', flexDirection: 'column', minWidth: 0 }),
  titleRow: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(2),
    justifyContent: 'space-between',
    minWidth: 0,
  }),
  identityGroup: css({
    alignItems: 'center',
    display: 'flex',
    gap: theme.spacing(1),
    minWidth: 0,
  }),
  typePill: css({
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    color: theme.colors.text.primary,
    flexShrink: 0,
    fontSize: theme.typography.bodySmall.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    padding: theme.spacing(0.25, 1),
    whiteSpace: 'nowrap',
  }),
  identityText: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.25),
    minWidth: 0,
  }),
  actions: css({ flexShrink: 0 }),
  target: css({
    alignItems: 'baseline',
    color: theme.colors.text.secondary,
    display: 'flex',
    flex: '0 1 auto',
    fontSize: theme.typography.bodySmall.fontSize,
    fontFamily: theme.typography.fontFamilyMonospace,
    gap: theme.spacing(1),
    maxWidth: 'min(100%, 520px)',
    minWidth: 0,
  }),
  qualifier: css({
    flexShrink: 0,
    fontWeight: theme.typography.fontWeightMedium,
  }),
  targetValue: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
});
