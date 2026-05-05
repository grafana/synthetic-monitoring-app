import React from 'react';
import { Badge, Card, Icon, Stack, Tooltip, useStyles2 } from '@grafana/ui';

import type { InsightsResponse } from 'datasource/responses.types';

import { LimitBar, ProbeHistogram } from './InsightsPage.components';
import { getStyles } from './InsightsPage.styles';
import { CHECKS_URL, getCheckDashboardUrl, getCheckLabel } from './InsightsPage.utils';

interface UnlabeledCheck {
  id?: number;
  job: string;
}

export function UsageSection({ data, unlabeledChecks, checkProbeNames }: {
  data: InsightsResponse;
  unlabeledChecks: UnlabeledCheck[];
  checkProbeNames: Map<number, string[]>;
}) {
  const styles = useStyles2(getStyles);
  const { usage } = data;
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div>
      <button className={styles.collapseToggle} onClick={() => setIsOpen(!isOpen)}>
        <Icon name={isOpen ? 'angle-down' : 'angle-right'} />
        <h3 className={styles.collapseHeading}>Usage</h3>
      </button>
      {isOpen && <>
        <div className={styles.cardGrid}>
          <Card>
            <Card.Heading>Checks by type</Card.Heading>
            <Card.Description>
              <Stack direction="row" gap={1} wrap="wrap">
                {Object.entries(usage.checks_by_type).map(([type, count]) => (
                  <a key={type} href={`${CHECKS_URL}?type=${type}`}>
                    <Badge text={`${type}: ${count}`} color="blue" />
                  </a>
                ))}
              </Stack>
            </Card.Description>
          </Card>

          <Card>
            <Card.Heading>Checks by status</Card.Heading>
            <Card.Description>
              <Stack direction="row" gap={1}>
                <a href={`${CHECKS_URL}?status=enabled`}>
                  <Badge text={`Enabled: ${usage.checks_by_status.enabled}`} color="green" />
                </a>
                <a href={`${CHECKS_URL}?status=disabled`}>
                  <Badge text={`Disabled: ${usage.checks_by_status.disabled}`} color="orange" />
                </a>
              </Stack>
            </Card.Description>
          </Card>

          <Card>
            <Card.Heading>Limit usage</Card.Heading>
            <Card.Description>
              <Stack direction="column" gap={0.5}>
                <LimitBar label="Total checks" current={usage.limit_usage.total_checks.current} max={usage.limit_usage.total_checks.max} href={CHECKS_URL} />
                <LimitBar label="Scripted" current={usage.limit_usage.scripted_checks.current} max={usage.limit_usage.scripted_checks.max} href={`${CHECKS_URL}?type=scripted`} />
                <LimitBar label="Browser" current={usage.limit_usage.browser_checks.current} max={usage.limit_usage.browser_checks.max} href={`${CHECKS_URL}?type=browser`} />
              </Stack>
            </Card.Description>
          </Card>

          <Card>
            <Card.Heading>Probe distribution</Card.Heading>
            <Card.Description>
              <Stack direction="column" gap={1}>
                <ProbeHistogram histogram={usage.probe_distribution.histogram} />
                {usage.probe_distribution.checks_with_few_probes.length > 0 && (
                  <Tooltip
                    interactive
                    content={
                      <Stack direction="column" gap={0.5}>
                        {usage.probe_distribution.checks_with_few_probes.map((c) => {
                          const name = getCheckLabel(c.check_id, data.checks);
                          const probeNames = checkProbeNames.get(c.check_id) ?? [];
                          return (
                            <div key={c.check_id}>
                              <a href={`${CHECKS_URL}?search=${encodeURIComponent(name)}`}>
                                <strong>{name}</strong>
                              </a>
                              <br />
                              <span>{probeNames.length > 0 ? probeNames.join(', ') : 'No probes'}</span>
                            </div>
                          );
                        })}
                      </Stack>
                    }
                    placement="bottom"
                  >
                    <span className={styles.tooltipLink}>
                      {usage.probe_distribution.checks_with_few_probes.length} checks with {'<'} 3 probes
                    </span>
                  </Tooltip>
                )}
              </Stack>
            </Card.Description>
          </Card>

          <Card>
            <Card.Heading>Labels</Card.Heading>
            <Card.Description>
              {usage.label_distribution.length > 0 ? (
                <Stack direction="column" gap={0.5}>
                  <Stack direction="row" gap={1} wrap="wrap">
                    {usage.label_distribution.map((label) => (
                      <a key={label.name} href={`${CHECKS_URL}?labels=${encodeURIComponent(label.name)}`}>
                        <Badge text={`${label.name} (${label.count})`} color="purple" />
                      </a>
                    ))}
                  </Stack>
                  {unlabeledChecks.length > 0 && (
                    <Tooltip
                      interactive
                      content={
                        <Stack direction="column" gap={0.25}>
                          {unlabeledChecks.map((c) => (
                            <a key={c.id} href={getCheckDashboardUrl(c.id ?? 0)}>
                              {c.job}
                            </a>
                          ))}
                        </Stack>
                      }
                      placement="bottom"
                    >
                      <span className={styles.tooltipLink}>{unlabeledChecks.length} checks have no labels</span>
                    </Tooltip>
                  )}
                </Stack>
              ) : (
                <span className={styles.mutedText}>No checks have labels</span>
              )}
            </Card.Description>
          </Card>
        </div>
      </>}
    </div>
  );
}
