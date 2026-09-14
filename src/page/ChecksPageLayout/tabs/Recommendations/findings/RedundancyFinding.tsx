import React from 'react';
import { t } from '@grafana/i18n';
import { trackRecommendationActioned } from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';

import { GroupRow, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { getChecksByTargetUrl } from '../Recommendations.links';

/**
 * C. Duplicate checks and overlapping targets. Whether a group is waste or intentional needs a
 * human call, and deleting is destructive, so each group deep-links into the check list filtered
 * to just those checks, where they can be compared and bulk-deleted with the usual confirmation.
 */
export function RedundancyFinding({ recommendation, totalCheckCount, isFocused, onDismiss }: FindingProps) {
  const { id, groups = [] } = recommendation;
  const { severity, title, tooltip } = getRecommendationCopy(id, []);

  return (
    <RecommendationSection
      title={title}
      tooltip={tooltip}
      summary={getRecommendationSummary(recommendation, totalCheckCount)}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
    >
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
            onCheckEditClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
          />
        )}
      />
    </RecommendationSection>
  );
}
