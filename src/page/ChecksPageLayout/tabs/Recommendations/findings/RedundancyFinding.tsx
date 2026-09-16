import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { LinkButton } from '@grafana/ui';
import { trackRecommendationActioned } from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { Check } from 'types';
import { formatDuration } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useProbes } from 'data/useProbes';

import { CheckRow, GroupRow, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { getChecksByTargetUrl } from '../Recommendations.links';
import { describeProbes } from '../Recommendations.utils';
import { useFindingPanel } from './Finding.hooks';

/**
 * C. Duplicate checks and overlapping targets. Whether a group is waste or intentional needs a
 * human call, so each check inside a group shows the settings that tell an accidental copy from a
 * deliberate one (frequency, probes) and has the editor as its action. Deleting is destructive and
 * stays with the check list, which each group deep-links to and which already confirms. Groups are
 * the unit here, so rows carry no checkbox or dismiss.
 */
export function RedundancyFinding({ recommendation, totalCheckCount, isSolo, isFocused, onDismiss }: FindingProps) {
  const { id, groups = [] } = recommendation;
  const { severity, header } = useFindingPanel({ recommendation, totalCheckCount, isSolo });
  // Not suspended on: the finding is useful before probe names arrive, and counts stand in for them.
  const { data: probes = [] } = useProbes();

  const renderCheck = (check: Check) => (
    <CheckRow
      key={check.id}
      check={check}
      // A paused copy is the obvious one to drop, so it says so here instead of via the badge other rows lost.
      detail={
        check.enabled
          ? t('recommendations.redundancy.row.settings', 'Every {{frequency}} · {{probes}}', {
              frequency: formatDuration(check.frequency, true),
              probes: describeProbes(check, probes),
            })
          : t('recommendations.redundancy.row.settingsPaused', 'Every {{frequency}} · {{probes}} · paused', {
              frequency: formatDuration(check.frequency, true),
              probes: describeProbes(check, probes),
            })
      }
      // Editing is the action here, so it takes the action's place rather than the small edit button.
      showEditButton={false}
      action={
        <LinkButton
          size="sm"
          variant="primary"
          href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}
          onClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
          aria-label={t('recommendations.redundancy.row.editLabel', 'Open {{job}} in the check editor', {
            job: check.job,
          })}
        >
          <Trans i18nKey="recommendations.redundancy.row.edit">Edit check</Trans>
        </LinkButton>
      }
    />
  );

  return (
    <RecommendationSection {...header} severity={severity} isFocused={isFocused} onDismiss={onDismiss}>
      <PaginatedRows
        items={groups}
        renderItem={(group) => (
          <GroupRow
            key={group.key}
            label={group.label}
            detail={
              group.detail
                ? t('recommendations.group.detail', '{{detail}} · {{checkCount}} checks', {
                    detail: group.detail,
                    checkCount: group.checks.length,
                  })
                : t('recommendations.group.count', '{{checkCount}} checks', { checkCount: group.checks.length })
            }
            checks={group.checks}
            href={getChecksByTargetUrl(group.label, group.type)}
            onLinkClick={() => trackRecommendationActioned({ finding: id, scope: 'group' })}
            renderCheck={renderCheck}
          />
        )}
      />
    </RecommendationSection>
  );
}
