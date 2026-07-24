import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { Icon, Tag, useStyles2 } from '@grafana/ui';
import { css, cx } from '@emotion/css';

import { CheckHeaderDefinitionModel, HeaderDefinitionFact } from './CheckDashboardHeader.types';
import { Toggletip } from 'components/Toggletip';

const MAX_INLINE_LABELS = 3;

function formatLabelName(name: string, value: string) {
  return `${name}: ${value}`;
}

export function CheckDefinitionSummary({ model }: { model: CheckHeaderDefinitionModel }) {
  const styles = useStyles2(getStyles);
  const visibleLabels = model.labels.slice(0, MAX_INLINE_LABELS);
  const additionalLabels = model.labels.slice(MAX_INLINE_LABELS);
  const configFacts = model.facts.filter((fact) => fact.kind !== 'result');
  const resultFacts = model.facts.filter((fact) => fact.kind === 'result');

  const renderToken = (fact: HeaderDefinitionFact, isResult: boolean) => (
    <div className={cx(styles.token, isResult && styles.tokenResult)} key={fact.id}>
      <dt className={styles.tokenKey}>
        {fact.icon ? <Icon aria-hidden className={styles.tokenIcon} name={fact.icon} size="xs" /> : null}
        {fact.label}
      </dt>
      <dd className={styles.tokenValue}>{fact.value}</dd>
    </div>
  );

  return (
    <section aria-label="Check definition" className={styles.container}>
      <div className={styles.definitionRow}>
        <dl aria-label="Check configuration" className={styles.rail}>
          <div aria-label="Check type" className={styles.token}>
            <dd className={styles.tokenValue}>{model.typeLabel}</dd>
          </div>
          {configFacts.map((fact) => renderToken(fact, false))}
          {resultFacts.length > 0 ? <div aria-hidden className={styles.groupSeparator} /> : null}
          {resultFacts.map((fact) => renderToken(fact, true))}
        </dl>

        {model.labels.length > 0 ? (
          <div className={cx(styles.group, styles.labelsGroup)}>
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
    gap: theme.spacing(1.5, 3),
    justifyContent: 'space-between',
  }),
  rail: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
    margin: 0,
    minWidth: 0,
  }),
  token: css({
    alignItems: 'center',
    background: theme.colors.background.secondary,
    border: `1px solid ${theme.colors.border.weak}`,
    borderRadius: theme.shape.radius.default,
    display: 'inline-flex',
    gap: theme.spacing(0.75),
    padding: theme.spacing(0.5, 1),
  }),
  tokenResult: css({
    borderColor: theme.colors.success.borderTransparent,
    '& dt, & svg': {
      color: theme.colors.success.text,
    },
  }),
  tokenKey: css({
    alignItems: 'center',
    color: theme.colors.text.secondary,
    display: 'inline-flex',
    fontSize: theme.typography.bodySmall.fontSize,
    gap: theme.spacing(0.5),
    whiteSpace: 'nowrap',
  }),
  tokenIcon: css({
    color: theme.colors.text.secondary,
  }),
  tokenValue: css({
    color: theme.colors.text.primary,
    fontSize: theme.typography.body.fontSize,
    fontWeight: theme.typography.fontWeightMedium,
    margin: 0,
    whiteSpace: 'nowrap',
  }),
  groupSeparator: css({
    alignSelf: 'stretch',
    background: theme.colors.border.weak,
    margin: theme.spacing(0.25, 0.5),
    width: 1,
  }),
  group: css({
    display: 'flex',
    flexDirection: 'column',
    gap: theme.spacing(0.75),
    minWidth: 0,
  }),
  labelsGroup: css({
    alignItems: 'flex-end',
  }),
  labels: css({
    alignItems: 'center',
    display: 'flex',
    flexWrap: 'wrap',
    gap: theme.spacing(0.5),
    justifyContent: 'flex-end',
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
