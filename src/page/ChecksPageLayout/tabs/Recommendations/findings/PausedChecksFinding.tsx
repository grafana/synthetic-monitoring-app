import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dateTimeFormatTimeAgo } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, LinkButton, useStyles2 } from '@grafana/ui';
import {
  trackRecommendationActionCompleted,
  trackRecommendationActioned,
} from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { Check } from 'types';
import { QUERY_KEYS, useUpdateCheck } from 'data/useChecks';

import { CheckRow, PaginatedRows, RecommendationSection } from '../Recommendations.components';
import { getRecommendationCopy, getRecommendationSummary } from '../Recommendations.copy';
import { getPausedChecksUrl } from '../Recommendations.links';
import { getStyles } from '../Recommendations.styles';
import { getPausedSince } from '../Recommendations.utils';

/**
 * D. Paused checks, longest-paused first. Resuming is safe and reversible so it is offered in
 * place; deleting is not, so that stays with the check list, which already confirms it.
 */
export function PausedChecksFinding({ recommendation, totalCheckCount, isFocused, onDismiss }: FindingProps) {
  const { id, checks } = recommendation;
  const { severity, title, tooltip } = getRecommendationCopy(id, []);

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
          href={getPausedChecksUrl()}
          onClick={() => trackRecommendationActioned({ finding: id, scope: 'finding' })}
        >
          <Trans i18nKey="recommendations.pausedChecks.action">Review paused checks</Trans>
        </LinkButton>
      }
    >
      <PaginatedRows
        items={checks}
        renderItem={(check) => (
          <PausedCheckRow
            key={check.id}
            check={check}
            onEditClick={() => trackRecommendationActioned({ finding: id, scope: 'check' })}
            onResumed={() =>
              trackRecommendationActionCompleted({
                finding: id,
                action: 'check_resumed',
                checkCount: 1,
                scope: 'check',
              })
            }
          />
        )}
      />
    </RecommendationSection>
  );
}

interface PausedCheckRowProps {
  check: Check;
  onEditClick: () => void;
  onResumed: () => void;
}

function PausedCheckRow({ check, onEditClick, onResumed }: PausedCheckRowProps) {
  const styles = useStyles2(getStyles);
  const queryClient = useQueryClient();
  const { mutateAsync: updateCheck } = useUpdateCheck();
  const [isResuming, setIsResuming] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const pausedSince = getPausedSince(check);

  const handleResume = async () => {
    setIsResuming(true);

    try {
      await updateCheck({ ...check, enabled: true });
    } catch {
      // The mutation's meta already raises the error toast.
      setIsResuming(false);
      return;
    }

    setIsDone(true);
    onResumed();
    // Refetching the check list is what removes this row from the finding.
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
  };

  return (
    <CheckRow
      check={check}
      onEditClick={onEditClick}
      detail={
        pausedSince &&
        t('recommendations.pausedChecks.row.since', 'Paused {{timeAgo}}', {
          timeAgo: dateTimeFormatTimeAgo(pausedSince),
        })
      }
      action={
        isDone ? (
          <span className={styles.doneText}>
            <Trans i18nKey="recommendations.pausedChecks.row.done">Resumed</Trans>
          </span>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            fill="outline"
            icon={isResuming ? 'spinner' : 'play'}
            disabled={isResuming}
            onClick={handleResume}
            aria-label={t('recommendations.pausedChecks.row.resumeLabel', 'Resume {{job}}', { job: check.job })}
          >
            <Trans i18nKey="recommendations.pausedChecks.row.resume">Resume</Trans>
          </Button>
        )
      }
    />
  );
}
