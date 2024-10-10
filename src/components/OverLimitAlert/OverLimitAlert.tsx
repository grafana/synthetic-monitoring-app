import React from 'react';
import { GrafanaTheme2 } from '@grafana/data';
import { TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckType, ROUTES } from 'types';
import { FREE_EXECUTION_LIMIT } from 'hooks/useAtHgExecutionLimit';
import { useLimits } from 'hooks/useLimits';
import { useNavigation } from 'hooks/useNavigation';
import { ErrorAlert } from 'components/ErrorAlert';

export const OverLimitAlert = ({ checkType }: { checkType?: CheckType }) => {
  const nav = useNavigation();
  const { tenantLimits, isOverScriptedLimit, isOverCheckLimit, isOverHgExecutionLimit } = useLimits();
  const isRelevant = getIsRelevant(checkType);

  if (isOverHgExecutionLimit) {
    return (
      <ErrorAlert
        title="Execution limit reached"
        content={<OptionsWhenFree />}
        buttonText={'Back to checks'}
        onClick={() => {
          nav(ROUTES.Checks);
        }}
      />
    );
  }

  if (isOverCheckLimit) {
    return (
      <ErrorAlert
        title="Check limit reached"
        content={`You have reached the limit of checks you can create. Your current limit is ${tenantLimits?.MaxChecks}. You can delete existing checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
        buttonText={'Back to checks'}
        onClick={() => {
          nav(ROUTES.Checks);
        }}
      />
    );
  }

  if (isOverScriptedLimit && isRelevant) {
    return (
      <ErrorAlert
        title="Check limit reached"
        content={`You have reached the limit of scripted and multiHTTP checks you can create. Your current limit is ${tenantLimits?.MaxScriptedChecks}. You can delete existing multiHTTP or scripted checks or upgrade your plan to create more. Please contact support if you've reached this limit in error.`}
        buttonText={'Back to checks'}
        onClick={() => {
          nav(ROUTES.Checks);
        }}
      />
    );
  }

  return null;
};

function getIsRelevant(checkType?: CheckType) {
  if (!checkType) {
    return true;
  }

  if ([CheckType.Scripted, CheckType.MULTI_HTTP].includes(checkType)) {
    return true;
  }

  return false;
}

const OptionsWhenFree = () => {
  const styles = useStyles2(getStyles);

  return (
    <div>
      {`You have reached the limit of the monthly executions you can create. Your current execution limit is ${Intl.NumberFormat().format(
        FREE_EXECUTION_LIMIT
      )}. Your options are:`}
      <ul className={styles.ul}>
        <li>
          <TextLink href="https://grafana.com/pricing/" external>
            Upgrade your plan
          </TextLink>
        </li>
        <li>Delete existing checks</li>
        <li>Reduce the amount of executions on existing checks by either removing probes or reducing the frequency</li>
      </ul>
    </div>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  ul: css({
    listStyleType: 'initial',
    paddingLeft: theme.spacing(2),
  }),
});
