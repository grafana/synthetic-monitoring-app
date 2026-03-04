import React from 'react';
import { type ReactElement } from 'react';
import type { GrafanaTheme2 } from '@grafana/data';
import { useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import type { StatCard, StatStatus } from './svalinn.types';

interface Props {
  cards: StatCard[];
}

function getStatusColor(theme: GrafanaTheme2, status: StatStatus): string {
  switch (status) {
    case 'warning':
      return theme.colors.warning.text;
    case 'success':
      return theme.colors.success.text;
    case 'info':
      return theme.colors.info.text;
  }
}

export function StatCardsRow({ cards }: Props): ReactElement {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.grid}>
      {cards.map((card) => (
        <StatCardItem key={card.label} card={card} />
      ))}
    </div>
  );
}

function StatCardItem({ card }: { card: StatCard }): ReactElement {
  const styles = useStyles2(getStyles);
  const valueColor = useStyles2((theme) => getStatusColor(theme, card.status));

  return (
    <div className={styles.card}>
      <div className={styles.label}>{card.label}</div>
      <div className={styles.value} style={{ color: valueColor }}>
        {card.value}
      </div>
      <div className={styles.detail}>{card.detail}</div>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    grid: css({
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: theme.spacing(2),
      marginBottom: theme.spacing(3.5),
    }),
    card: css({
      background: theme.colors.background.primary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      padding: `${theme.spacing(2)} ${theme.spacing(2.5)}`,
    }),
    label: css({
      fontSize: theme.typography.bodySmall.fontSize,
      fontWeight: theme.typography.fontWeightMedium,
      color: theme.colors.text.disabled,
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: theme.spacing(0.5),
    }),
    value: css({
      fontSize: '32px',
      fontWeight: theme.typography.fontWeightBold,
      lineHeight: 1.2,
    }),
    detail: css({
      fontSize: theme.typography.bodySmall.fontSize,
      color: theme.colors.text.secondary,
      marginTop: theme.spacing(0.25),
    }),
  };
}
