import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { dateTimeFormatTimeAgo } from '@grafana/data';
import { t, Trans } from '@grafana/i18n';
import { Button, LinkButton } from '@grafana/ui';
import {
  trackRecommendationActionCompleted,
  trackRecommendationActioned,
} from 'features/tracking/recommendationEvents';

import { FindingProps } from './Finding.types';
import { Check } from 'types';
import { QUERY_KEYS, useBulkUpdateChecks, useUpdateCheck } from 'data/useChecks';

import {
  CheckRow,
  HeaderAction,
  PaginatedRows,
  PanelFooter,
  RecommendationSection,
} from '../Recommendations.components';
import { useRowSelection } from '../Recommendations.hooks';
import { getPausedChecksUrl } from '../Recommendations.links';
import { getPausedSince } from '../Recommendations.utils';
import { useFindingPanel } from './Finding.hooks';

/**
 * D. Paused checks, longest-paused first. Resuming is safe and reversible so it is offered in
 * place, one at a time or for the ticked rows; deleting is not, so that stays with the check
 * list, which already confirms it.
 */
export function PausedChecksFinding({ recommendation, totalCheckCount, isSolo, isFocused, onDismiss }: FindingProps) {
  const { id } = recommendation;
  const { severity, header, rows, dismissedCount, dismissCheck, restoreChecks } = useFindingPanel({
    recommendation,
    totalCheckCount,
    isSolo,
  });
  const queryClient = useQueryClient();
  // The same call the check list's bulk actions make: one request, one "Updated N checks." toast.
  const { mutateAsync: bulkUpdateChecks, isPending: isResuming } = useBulkUpdateChecks();
  const selection = useRowSelection(rows);
  const selectedCount = selection.selected.length;

  const handleResumeSelected = async () => {
    const checkCount = selection.selected.length;

    try {
      await bulkUpdateChecks(selection.selected.map((check) => ({ ...check, enabled: true })));
    } catch {
      // The mutation's meta already raises the error toast; the selection stays for a retry.
      return;
    }

    trackRecommendationActionCompleted({ finding: id, action: 'check_resumed', checkCount, scope: 'finding' });
    await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.list });
    selection.clear();
  };

  return (
    <RecommendationSection
      {...header}
      severity={severity}
      isFocused={isFocused}
      onDismiss={onDismiss}
      actions={
        // Resuming everything at once is not offered: some of these are paused on purpose.
        <HeaderAction
          label={
            selectedCount === 1
              ? t('recommendations.pausedChecks.resumeSelectedSingle', 'Resume 1 check')
              : selectedCount > 1
                ? t('recommendations.pausedChecks.resumeSelected', 'Resume {{checkCount}} checks', {
                    checkCount: selectedCount,
                  })
                : undefined
          }
          selectedCount={selectedCount}
          isBusy={isResuming}
          onAction={handleResumeSelected}
          onClearSelection={selection.clear}
        />
      }
      footer={
        <PanelFooter
          dismissedCount={dismissedCount}
          onRestore={restoreChecks}
          secondaryAction={
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
        />
      }
    >
      <PaginatedRows
        items={rows}
        renderItem={(check) => (
          <PausedCheckRow
            key={check.id}
            check={check}
            isSelected={selection.isSelected(check)}
            onSelectChange={selection.toggle}
            onDismiss={dismissCheck}
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
  isSelected: boolean;
  onSelectChange: (check: Check) => void;
  onDismiss: (check: Check) => void;
  onEditClick: () => void;
  onResumed: () => void;
}

function PausedCheckRow({ check, isSelected, onSelectChange, onDismiss, onEditClick, onResumed }: PausedCheckRowProps) {
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
      doneLabel={isDone ? t('recommendations.pausedChecks.row.done', 'Resumed') : undefined}
      isSelected={isSelected}
      onSelectChange={onSelectChange}
      onDismiss={onDismiss}
      onEditClick={onEditClick}
      detail={
        pausedSince &&
        t('recommendations.pausedChecks.row.since', 'Paused {{timeAgo}}', {
          timeAgo: dateTimeFormatTimeAgo(pausedSince),
        })
      }
      action={
        <Button
          size="sm"
          variant="primary"
          icon={isResuming ? 'spinner' : 'play'}
          disabled={isResuming}
          onClick={handleResume}
          aria-label={t('recommendations.pausedChecks.row.resumeLabel', 'Resume {{job}}', { job: check.job })}
        >
          <Trans i18nKey="recommendations.pausedChecks.row.resume">Resume</Trans>
        </Button>
      }
    />
  );
}
