import React, { useMemo } from 'react';
import { t, Trans } from '@grafana/i18n';
import { LinkButton } from '@grafana/ui';
import { trackRecommendationActioned } from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { Check } from 'types';
import { formatDuration, getCheckType } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useProbes } from 'data/useProbes';

import { CheckRow, GroupRow, PaginatedRows, PanelFooter, RecommendationSection } from '../Recommendations.components';
import { getChecksByTargetUrl } from '../Recommendations.links';
import { describeProbes } from '../Recommendations.utils';
import { useFindingPanel } from './Finding.hooks';

// Whether a group is waste or deliberate is a human call, so rows show frequency and probes and
// link to the editor. Deleting stays with the check list, which each group links to.
export function RedundancyFinding({ recommendation, totalCheckCount, isSolo, isFocused, onDismiss }: FindingProps) {
  const { id, groups = [] } = recommendation;
  const { severity, header, rows, dismissedCount, dismissCheck, restoreChecks } = useFindingPanel({
    recommendation,
    totalCheckCount,
    isSolo,
  });

  // Dismissing a deliberate copy takes it out of its group. A duplicate group needs two checks
  // to still be a duplicate; an overlapping group needs two check types.
  const visibleGroups = useMemo(() => {
    const kept = new Set(rows.map((check) => check.id));

    return groups
      .map((group) => ({ ...group, checks: group.checks.filter((check) => kept.has(check.id)) }))
      .filter((group) =>
        group.type
          ? group.checks.length > 1
          : new Set(group.checks.map((check) => getCheckType(check.settings))).size > 1
      );
  }, [groups, rows]);
  // Not suspended on; counts stand in until names arrive.
  const { data: probes = [] } = useProbes();

  const renderCheck = (check: Check) => (
    <CheckRow
      key={check.id}
      check={check}
      // A paused copy is the obvious one to drop.
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
      onDismiss={dismissCheck}
      // Editing is the action here.
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
    <RecommendationSection
      {...header}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
      footer={<PanelFooter dismissedCount={dismissedCount} onRestore={restoreChecks} />}
    >
      <PaginatedRows
        items={visibleGroups}
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
