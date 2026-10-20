import React from 'react';
import { Card, LinkButton, Stack, TagList, TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { formatDuration, hasGlobalPermission } from 'utils';
import { MigratedLegacyAlertGroup, MigratedLegacyAlertRule } from 'data/useGMAlerts';
import { alertDescriptionFromExpr } from 'components/alertingTransformations';

interface MigratedLegacyAlertsProps {
  groups: MigratedLegacyAlertGroup[];
}

export const MigratedLegacyAlerts = ({ groups }: MigratedLegacyAlertsProps) => {
  const canEditRules = hasGlobalPermission('alert.rules:write');

  return (
    <Stack direction="column" gap={2}>
      <p>
        These legacy alerts have been migrated to Grafana-managed alerting and are read-only here. Edit them in Alerts
        &amp; IRM. To tie one of these alerts to a check, select its alert sensitivity in the Alerting section of the
        check form.
      </p>
      {groups.map((group) => (
        <Stack key={`${group.folderUid}-${group.name}`} direction="column" gap={1}>
          <TextLink href={getGroupUrl(group)}>{`${group.file} > ${group.name}`}</TextLink>
          {group.rules.map((rule) => (
            <MigratedLegacyAlert key={rule.uid ?? rule.name} rule={rule} canEditRules={canEditRules} />
          ))}
        </Stack>
      ))}
    </Stack>
  );
};

interface MigratedLegacyAlertProps {
  rule: MigratedLegacyAlertRule;
  canEditRules: boolean;
}

const MigratedLegacyAlert = ({ rule, canEditRules }: MigratedLegacyAlertProps) => {
  const styles = useStyles2(getStyles);
  const labels = Object.entries(rule.labels)
    .filter(([name]) => !name.startsWith('__'))
    .map(([name, value]) => `${name}=${value}`);

  return (
    <Card noMargin>
      <Card.Heading className={styles.heading}>{rule.name}</Card.Heading>
      <Card.Description>
        <Stack direction="column" gap={1}>
          <RuleDescription rule={rule} />
          {labels.length > 0 && <TagList className={styles.tags} tags={labels} />}
        </Stack>
      </Card.Description>
      {rule.uid && (
        <Card.Actions>
          {canEditRules && (
            <LinkButton
              aria-label={`Edit ${rule.name}`}
              href={`/alerting/${encodeURIComponent(rule.uid)}/edit`}
              icon="pen"
              size="sm"
              variant="secondary"
            >
              Edit
            </LinkButton>
          )}
          <LinkButton
            aria-label={`View ${rule.name}`}
            fill="outline"
            href={`/alerting/grafana/${encodeURIComponent(rule.uid)}/view`}
            icon="eye"
            size="sm"
            variant="secondary"
          >
            View
          </LinkButton>
        </Card.Actions>
      )}
    </Card>
  );
};

const RuleDescription = ({ rule }: { rule: MigratedLegacyAlertRule }) => {
  const styles = useStyles2(getStyles);
  const description = alertDescriptionFromExpr(rule.query);

  if (!description || description.operator !== '<') {
    return (
      <div>
        Expression: <code className={styles.expression}>{rule.query}</code>
      </div>
    );
  }

  const pendingPeriod = formatDuration((rule.duration ?? 0) * 1000);

  return (
    <div>{`Checks with a sensitivity level of ${description.sensitivity} will fire an alert if less than ${description.threshold}% of probes report connection success for ${pendingPeriod}.`}</div>
  );
};

function getGroupUrl({ folderUid, name }: MigratedLegacyAlertGroup) {
  return `/alerting/grafana/namespaces/${encodeURIComponent(folderUid)}/groups/${encodeURIComponent(name)}/view`;
}

const getStyles = () => ({
  expression: css({
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
  }),
  heading: css({
    overflowWrap: 'anywhere',
  }),
  tags: css({
    justifyContent: 'flex-start',
  }),
});
