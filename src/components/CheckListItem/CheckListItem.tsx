import React, { ChangeEvent } from 'react';
import { SuccessRateGauge } from 'components/SuccessRateGauge';
import { checkType as getCheckType } from 'utils';
import { Check, CheckListViewType, CheckType, FilteredCheck, Label } from 'types';
import { useStyles2, Checkbox, HorizontalGroup } from '@grafana/ui';
import { css, cx } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
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

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    background-color: ${theme.colors.background.secondary};
    border: 1px solid ${theme.colors.border.medium};
    border-radius: 2px;
    width: 100%;
    margin-bottom: ${theme.spacing(1)};
  `,
  cardWrapper: css`
    display: flex;
    flex-direction: row;
    padding: ${theme.spacing(2)};
    padding-bottom: ${theme.spacing(1)};
    overflow: none;
  `,
  listCardWrapper: css`
    display: grid;
    grid-template-columns: auto 175px minmax(1px, 1fr) auto auto auto;
    align-content: center;
    grid-column-gap: ${theme.spacing(2)};
    padding: 12px ${theme.spacing(2)};
  `,
  disabledCard: css`
    background-color: ${theme.colors.secondary.transparent};
    border-color: ${theme.colors.border.medium};
  `,
  checkbox: css`
    padding-top: ${theme.spacing(0.5)};
    margin-right: ${theme.spacing(1)};
    display: flex;
    align-items: flex-start;
  `,
  body: css`
    display: flex;
    flex-direction: row;
    flex-grow: 1;
    padding-right: ${theme.spacing(2)};
    overflow: hidden;
    border-bottom: 1px solid ${theme.colors.border.medium};
  `,
  bodyDisabled: css`
    border-color: ${theme.colors.border.medium};
  `,
  checkInfoContainer: css`
    flex-grow: 1;
    overflow: hidden;
  `,
  statusDetailsCardView: css`
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: ${theme.spacing(1)};
  `,
  statusTypeCardView: css`
    margin-right: ${theme.spacing(1)};
  `,
  checkTarget: css`
    font-size: ${theme.typography.bodySmall.fontSize};
    line-height: ${theme.typography.bodySmall.lineHeight};
    font-weight: ${theme.typography.fontWeightBold};
    margin-bottom: ${theme.spacing(1)};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  `,
  checkTargetListView: css`
    margin-bottom: 0px;
    justify-self: left;
    font-weight: ${theme.typography.fontWeightRegular};
    line-height: ${theme.typography.body.lineHeight};
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
    padding-top: ${theme.spacing(1)};
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
  const styles = useStyles2(getStyles);
  const checkType = getCheckType(check.settings);
  const usage = useUsageCalc(check);

  if (viewType === CheckListViewType.List) {
    return (
      <div className={cx(styles.container, { [styles.disabledCard]: !check.enabled })}>
        <div className={styles.listCardWrapper}>
          <div className={styles.checkbox}>
            <Checkbox
              aria-label="Select check"
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
      <div className={styles.cardWrapper} data-testid="check-card">
        <div className={styles.checkbox}>
          <Checkbox
            aria-label="Select check"
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
                    title="Uptime"
                    type={SuccessRateTypes.Checks}
                    id={check.id}
                    height={75}
                    width={150}
                  />
                  <SuccessRateGauge
                    title="Reachability"
                    type={SuccessRateTypes.Checks}
                    id={check.id}
                    height={75}
                    width={150}
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
