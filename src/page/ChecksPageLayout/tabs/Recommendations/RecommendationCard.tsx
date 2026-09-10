import React from 'react';
import { GrafanaTheme2, IconName } from '@grafana/data';
import { t } from '@grafana/i18n';
import { Icon, LinkButton, Stack, Text, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { RECOMMENDATIONS_TEST_ID } from 'test/dataTestIds';

import { RecommendationGroup } from './Recommendations.types';

interface RecommendationCardProps {
  icon: IconName;
  title: string;
  description: string;
  checkCount: number;
  action: { label: string; href: string; onClick: () => void };
  groups?: RecommendationGroup[];
  onGroupClick?: () => void;
  getGroupHref?: (group: RecommendationGroup) => string;
}

export function RecommendationCard({
  icon,
  title,
  description,
  checkCount,
  action,
  groups,
  onGroupClick,
  getGroupHref,
}: RecommendationCardProps) {
  const styles = useStyles2(getStyles);

  return (
    <div className={styles.card} data-testid={RECOMMENDATIONS_TEST_ID.card}>
      <Stack direction="row" gap={2} alignItems="flex-start">
        <Icon className={styles.icon} name={icon} size="xl" />
        <Stack direction="column" gap={1} grow={1}>
          <Stack direction="row" gap={1} alignItems="center" wrap="wrap">
            <Text element="h3" variant="h5">
              {title}
            </Text>
            <span
              className={styles.count}
              aria-label={t('recommendations.card.checkCount', 'Affected checks: {{checkCount}}', { checkCount })}
            >
              {checkCount}
            </span>
          </Stack>
          <Text color="secondary">{description}</Text>
          {groups && getGroupHref && (
            <ul className={styles.groups}>
              {groups.map((group) => (
                <li key={group.key} className={styles.group}>
                  <TextLink href={getGroupHref(group)} onClick={onGroupClick}>
                    {group.label}
                  </TextLink>
                  {/* Groups only exist where more than one check is involved, so the plural always holds. */}
                  <Text color="secondary" variant="bodySmall">
                    {group.detail
                      ? t('recommendations.card.groupDetail', '{{detail}} · {{checkCount}} checks', {
                          detail: group.detail,
                          checkCount: group.checks.length,
                        })
                      : t('recommendations.card.groupCount', '{{checkCount}} checks', {
                          checkCount: group.checks.length,
                        })}
                  </Text>
                </li>
              ))}
            </ul>
          )}
        </Stack>
        <LinkButton variant="secondary" fill="outline" size="sm" href={action.href} onClick={action.onClick}>
          {action.label}
        </LinkButton>
      </Stack>
    </div>
  );
}

function getStyles(theme: GrafanaTheme2) {
  return {
    card: css({
      background: theme.colors.background.secondary,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.default,
      padding: theme.spacing(2),
    }),
    icon: css({
      color: theme.colors.text.secondary,
      flexShrink: 0,
      marginTop: theme.spacing(0.5),
    }),
    count: css({
      background: theme.colors.background.canvas,
      border: `1px solid ${theme.colors.border.weak}`,
      borderRadius: theme.shape.radius.pill,
      color: theme.colors.text.secondary,
      fontSize: theme.typography.bodySmall.fontSize,
      padding: theme.spacing(0, 1),
    }),
    groups: css({
      display: 'flex',
      flexDirection: 'column',
      gap: theme.spacing(0.5),
      listStyle: 'none',
      margin: theme.spacing(0.5, 0, 0),
      padding: 0,
    }),
    group: css({
      display: 'flex',
      gap: theme.spacing(1),
      alignItems: 'baseline',
    }),
  };
}
