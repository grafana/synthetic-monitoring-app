import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { LinkButton } from '@grafana/ui';
import { trackRecommendationActioned } from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getMissingCalNames } from 'page/CheckList/CheckList.utils';

import { CheckRow, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { getChecksMissingCostLabelsUrl } from '../Recommendations.links';

interface MissingCostLabelsFindingProps extends FindingProps {
  calNames: string[];
}

/**
 * B. Checks missing a cost attribution label. A label needs a value we cannot guess, so the
 * action is the check editor; each row says which labels it lacks so the visit is a short one.
 */
export function MissingCostLabelsFinding({
  recommendation,
  totalCheckCount,
  calNames,
  isFocused,
  onDismiss,
}: MissingCostLabelsFindingProps) {
  const { id, checks } = recommendation;
  const { severity, title, tooltip } = getRecommendationCopy(id, calNames);

  return (
    <RecommendationSection
      title={title}
      tooltip={tooltip}
      summary={getRecommendationSummary(recommendation, totalCheckCount)}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
      actions={
        <LinkButton
          variant="secondary"
          fill="outline"
          size="sm"
          href={getChecksMissingCostLabelsUrl(calNames)}
          onClick={() => trackRecommendationActioned({ finding: id, scope: 'finding' })}
        >
          <Trans i18nKey="recommendations.missingCostLabels.action">View in check list</Trans>
        </LinkButton>
      }
    >
      <PaginatedRows
        items={checks}
        renderItem={(check) => (
          <CheckRow
            key={check.id}
            check={check}
            detail={t('recommendations.missingCostLabels.row.missing', 'Missing {{labels}}', {
              labels: getMissingCalNames(check.labels, calNames).join(', '),
            })}
            onEditClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
            action={
              <LinkButton
                size="sm"
                variant="secondary"
                fill="outline"
                href={generateRoutePath(AppRoutes.EditCheck, { id: check.id! })}
                onClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
                aria-label={t('recommendations.missingCostLabels.row.addLabelsLabel', 'Add labels to {{job}}', {
                  job: check.job,
                })}
              >
                <Trans i18nKey="recommendations.missingCostLabels.row.addLabels">Add labels</Trans>
              </LinkButton>
            }
          />
        )}
      />
    </RecommendationSection>
  );
}
