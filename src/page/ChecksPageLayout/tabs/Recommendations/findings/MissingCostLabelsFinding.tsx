import React from 'react';
import { t, Trans } from '@grafana/i18n';
import { LinkButton } from '@grafana/ui';
import { trackRecommendationActioned } from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { AppRoutes } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { getMissingCalNames } from 'page/CheckList/CheckList.utils';

import { CheckRow, DismissedChecksFooter, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { getChecksMissingCostLabelsUrl } from '../Recommendations.links';
import { useFindingPanel } from './Finding.hooks';

interface MissingCostLabelsFindingProps extends FindingProps {
  calNames: string[];
}

/**
 * B. Checks missing a cost attribution label. A label needs a value we cannot guess, so the
 * action is the check editor and there is nothing to do in bulk; rows therefore have no
 * checkbox. Each row says which labels it lacks so the visit is a short one.
 */
export function MissingCostLabelsFinding({
  recommendation,
  totalCheckCount,
  calNames,
  isSolo,
  isFocused,
  onDismiss,
}: MissingCostLabelsFindingProps) {
  const { id } = recommendation;
  const { severity, header, rows, dismissedCount, dismissCheck, restoreChecks } = useFindingPanel(
    { recommendation, totalCheckCount, isSolo },
    calNames
  );

  return (
    <RecommendationSection
      {...header}
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
      footer={<DismissedChecksFooter dismissedCount={dismissedCount} onRestore={restoreChecks} />}
    >
      <PaginatedRows
        items={rows}
        renderItem={(check) => (
          <CheckRow
            key={check.id}
            check={check}
            detail={t('recommendations.missingCostLabels.row.missing', 'Missing {{labels}}', {
              labels: getMissingCalNames(check.labels, calNames).join(', '),
            })}
            onDismiss={dismissCheck}
            onEditClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
            action={
              <LinkButton
                size="sm"
                variant="primary"
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
