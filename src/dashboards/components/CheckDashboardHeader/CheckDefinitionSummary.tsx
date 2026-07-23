import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Tag, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckHeaderDefinitionModel } from './CheckDashboardHeader.types';
import { Toggletip } from 'components/Toggletip';

const MAX_INLINE_LABELS = 3;

function formatLabelName(name: string, value: string) {
  return `${name}: ${value}`;
}

export function CheckDefinitionSummary({ model }: { model: CheckHeaderDefinitionModel }) {
  const styles = useStyles2(getStyles);
  const visibleLabels = model.labels.slice(0, MAX_INLINE_LABELS);
  const additionalLabels = model.labels.slice(MAX_INLINE_LABELS);

  return (
    <section aria-label="Check configuration" className={styles.container}>
      <div className={styles.definitionRow}>
        <dl className={styles.factList}>
          {model.facts.map((fact) => (
            <div className={styles.fact} key={fact.id}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {model.labels.length > 0 ? (
          <div aria-label="Labels" className={styles.labels}>
            {visibleLabels.map((label) => (
              <Tag
                key={`${label.name}-${label.value}`}
                name={formatLabelName(label.name, label.value)}
                className={styles.label}
              />
            ))}
            {additionalLabels.length > 0 ? (
              <Toggletip
                content={
                  <div className={styles.additionalLabels}>
                    {additionalLabels.map((label) => (
                      <Tag
                        key={`${label.name}-${label.value}`}
                        name={formatLabelName(label.name, label.value)}
                        className={styles.label}
                      />
                    ))}
                  </div>
                }
              >
                <button aria-label="View additional labels" className={styles.labelButton} type="button">
                  +{additionalLabels.length} more
                </button>
              </Toggletip>
            ) : null}
          </div>
        ) : null}
      </div>
    </section>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(1),
    width: '100%',
  }),
  definitionRow: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5, 1),
  }),
  factList: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    margin: 0,
  }),
  fact: css({
    alignItems: 'baseline',
    border: `2px solid ${theme.colors.border.medium}`,
    borderRadius: theme.shape.radius.pill,
    display: 'flex',
    gap: theme.spacing(0.5),
    padding: theme.spacing(0.5, 2),
    whiteSpace: 'nowrap',
    '& dt': { color: theme.colors.text.secondary, fontSize: theme.typography.body.fontSize },
    '& dd': { fontSize: theme.typography.body.fontSize, margin: 0 },
  }),
  labels: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    marginLeft: 'auto',
  }),
  label: css({
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }),
  labelButton: css({
    background: 'transparent',
    border: 0,
    color: theme.colors.text.link,
    cursor: 'pointer',
    fontSize: theme.typography.bodySmall.fontSize,
    padding: theme.spacing(0.25, 0.5),
  }),
  additionalLabels: css({ display: 'flex', flexDirection: 'column', gap: theme.spacing(0.5) }),
});
