import React, { ChangeEvent } from 'react';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { checkType as getCheckType } from 'utils';
import { Check, CheckListViewType, CheckType, FilteredCheck, Label } from 'types';
import { useStyles, Checkbox, HorizontalGroup } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme } from '@grafana/data';
import { CheckCardLabel } from '../CheckCardLabel';
import { LatencyGauge } from '../LatencyGauge';
import { CheckItemActionButtons } from './CheckItemActionButtons';
import { CheckListItemDetails } from './CheckListItemDetails';
import { CheckStatusType } from './CheckStatusType';
import { SuccessRateTypes } from 'contexts/SuccessRateContext';
import { useUsageCalc } from 'hooks/useUsageCalc';

interface Props {
  check: FilteredCheck;
  selected: boolean;
  onLabelSelect: (label: Label) => void;
  onToggleCheckbox: (checkId: number) => void;
  onTypeSelect: (checkType: CheckType) => void;
  onStatusSelect: (checkStatus: boolean) => void;
  onDeleteCheck: (check: Check) => void;
  viewType: CheckListViewType;
}

const getStyles = (theme: GrafanaTheme) => ({
  container: css`
    background-color: ${theme.colors.bg2};
    border: 1px solid ${theme.isDark ? theme.colors.border2 : theme.colors.border1};
    border-radius: 2px;
    width: 100%;
    margin-bottom: ${theme.spacing.sm};
  `,
  cardWrapper: css`
    display: flex;
    flex-direction: row;
    padding: ${theme.spacing.md};
    padding-bottom: ${theme.spacing.sm};
    overflow: none;
  `,
  listCardWrapper: css`
    display: grid;
    grid-template-columns: auto 145px minmax(1px, 1fr) auto auto auto;
    align-content: center;
    grid-column-gap: ${theme.spacing.md};
    padding: 12px ${theme.spacing.md};
  `,
  disabledCard: css`
    background-color: ${theme.colors.bg3};
    border-color: ${theme.isDark ? theme.colors.border3 : theme.colors.border2};
  `,
  checkbox: css`
    padding-top: ${theme.spacing.xxs};
    margin-right: ${theme.spacing.sm};
    display: flex;
    align-items: flex-start;
  `,
  body: css`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding-right: ${theme.spacing.md};
    overflow: hidden;
    border-bottom: 1px solid ${theme.isDark ? theme.colors.border2 : theme.colors.border1};
  `,
  bodyDisabled: css`
    border-color: ${theme.isDark ? theme.colors.border3 : theme.colors.border2};
  `,
  checkInfoContainer: css`
    flex-grow: 1;
    overflow: hidden;
  `,
  statusDetailsCardView: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${theme.spacing.sm};
  `,
  statusTypeCardView: css`
    margin-right: ${theme.spacing.sm};
  `,
  checkTarget: css`
    font-size: ${theme.typography.size.sm};
    line-height: ${theme.typography.lineHeight.sm};
    font-weight: ${theme.typography.weight.bold};
    margin-bottom: ${theme.spacing.sm};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  `,
  checkTargetListView: css`
    margin-bottom: 0px;
    justify-self: left;
    font-weight: ${theme.typography.weight.regular};
    line-height: ${theme.typography.lineHeight.md};
    display: flex;
    align-items: center;
    width: 100%;
  `,
  checkJobListViewContainer: css`
    display: flex;
    align-items: center;
    justify-self: left;
    width: 100%;
  `,
  truncatedText: css`
    margin-bottom: 0px;
    width: 100%;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
  `,
  listItemDetails: css`
    justify-content: flex-end;
  `,
  stats: css`
    display: flex;
    flex-direction: row;
    align-items: center;
  `,
  footer: css`
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    width: 100%;
    padding-top: ${theme.spacing.sm};
  `,
  verticalGroup: css`
    display: flex;
    flex-direction: column;
    width: 100%;
    overflow: hidden;
  `,
  actionContainer: css`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100%;
  `,
});

export const CheckListItem = ({
  check,
  onLabelSelect,
  onTypeSelect,
  onStatusSelect,
  onDeleteCheck,
  selected,
  onToggleCheckbox,
  viewType = CheckListViewType.Card,
}: Props) => {
  const styles = useStyles(getStyles);
  const checkType = getCheckType(check.settings);

  const usage = useUsageCalc(check);

  if (viewType === CheckListViewType.List) {
    return (
      <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
        <div className={styles.listCardWrapper}>
          <div className={styles.checkbox}>
            <Checkbox
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                e.stopPropagation();
                onToggleCheckbox(check.id);
              }}
              checked={selected}
            />
          </div>
          <div className={styles.checkJobListViewContainer}>
            <span className={styles.truncatedText} title={check.job}>
              {check.job}
            </span>
          </div>
          <div className={cx(styles.checkTarget, styles.checkTargetListView)}>
            <span className={styles.truncatedText} title={check.target}>
              {check.target}
            </span>
          </div>
          <CheckStatusType
            enabled={check.enabled}
            checkType={checkType}
            onClickStatus={onStatusSelect}
            onClickType={onTypeSelect}
          />
          <CheckListItemDetails
            frequency={check.frequency}
            activeSeries={usage?.activeSeries}
            probeLocations={check.probes.length}
            className={styles.listItemDetails}
            labelCount={check.labels.length}
            labels={check.labels}
            onLabelClick={onLabelSelect}
          />
          <CheckItemActionButtons check={check} onRemoveCheck={onDeleteCheck} viewDashboardAsIcon />
        </div>
      </div>
    );
  }

  return (
    <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
      <div className={styles.cardWrapper} aria-label="check-card">
        <div className={styles.checkbox}>
          <Checkbox
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              e.stopPropagation();
              onToggleCheckbox(check.id);
            }}
            checked={selected}
          />
        </div>
        <div className={styles.verticalGroup}>
          <div className={cx(styles.body, { [styles.bodyDisabled]: !check.enabled })}>
            <div className={styles.checkInfoContainer}>
              <h3>{check.job}</h3>
              <div className={styles.checkTarget}>{check.target}</div>
              <div className={styles.statusDetailsCardView}>
                <CheckStatusType
                  enabled={check.enabled}
                  checkType={checkType}
                  onClickStatus={onStatusSelect}
                  onClickType={onTypeSelect}
                  className={styles.statusTypeCardView}
                />
                <CheckListItemDetails
                  frequency={check.frequency}
                  activeSeries={usage?.activeSeries}
                  probeLocations={check.probes.length}
                />
              </div>
            </div>
            <div className={styles.stats}>
              {check.enabled && (
                <>
                  <SuccessRateGauge
                    type={SuccessRateTypes.Checks}
                    id={check.id}
                    labelNames={['instance', 'job']}
                    labelValues={[check.target, check.job]}
                    height={75}
                    width={150}
                    sparkline={false}
                  />
                  <LatencyGauge target={check.target} job={check.job} height={75} width={175} />
                </>
              )}
            </div>
          </div>
          <div className={styles.footer}>
            <HorizontalGroup wrap>
              {check.labels.map((label: Label, index) => (
                <CheckCardLabel key={index} label={label} onLabelSelect={onLabelSelect} />
              ))}
            </HorizontalGroup>
            <div className={styles.actionContainer}>
              <CheckItemActionButtons check={check} onRemoveCheck={onDeleteCheck} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
