import React, { useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom-v5-compat';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFormPageParams, CheckType } from 'types';
import { createNavModel } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { useProbes } from 'data/useProbes';
import { CHECK_TYPE_GROUP_OPTIONS, useCheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { useHandleSubmitCheckster } from 'hooks/useHandleSubmitCheckster';
import { useIsOverlimit } from 'hooks/useIsOverlimit';
import { useURLSearchParams } from 'hooks/useURLSearchParams';
import { Checkster } from 'components/Checkster';
import { ChecksterProvider } from 'components/Checkster/contexts/ChecksterContext';
import { useDuplicateCheck } from 'page/NewCheck/NewCheckV2.hooks';
import { PluginPageNotFound } from 'page/NotFound';

import { CenteredSpinner } from '../../components/CenteredSpinner';
import { CHECK_TYPE_GROUP_DEFAULT_CHECK } from '../../components/Checkster/constants';
import { getUserPermissions } from '../../data/permissions';

const CHECK_TYPE_PARAM_NAME = 'checkType';

export function NewCheckV2() {
  const [params] = useSearchParams({});
  const checkType = (params.get(CHECK_TYPE_PARAM_NAME) as CheckType) ?? undefined;
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const { isLoading: isLoadingProbes, isFetched: isProbesFetched } = useProbes();
  const checkTypeGroupOption = useCheckTypeGroupOption(checkTypeGroup);
  const group = CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup);
  const styles = useStyles2(getStyles);
  const urlSearchParams = useURLSearchParams();
  const duplicateId = urlSearchParams.get('duplicateId');
  const { check: duplicateCheck, isLoading: isLoadingDuplicateCheck } = useDuplicateCheck(duplicateId);

  const navModel = createNavModel({ text: `Choose a check type`, url: generateRoutePath(AppRoutes.ChooseCheckGroup) }, [
    {
      text: `${duplicateCheck ? `Duplicate check ${duplicateCheck?.job}` : (checkTypeGroupOption?.label ?? 'Check not found')}`,
    },
  ]);

  const navigate = useNavigate();

  const handleSubmit = useHandleSubmitCheckster();
  const handleCheckTypeChange = useCallback(
    (newCheckType: CheckType) => {
      const search = new URLSearchParams(urlSearchParams);
      search.set(CHECK_TYPE_PARAM_NAME, newCheckType);
      navigate({ search: search.toString() }, { replace: true });
    },
    [navigate, urlSearchParams]
  );

  const isOverlimit = useIsOverlimit(false, checkType);
  const { canWriteChecks } = getUserPermissions();

  const isLoading = (isLoadingProbes && !isProbesFetched) || isOverlimit === null || isLoadingDuplicateCheck;

  if (!group) {
    return (
      <PluginPageNotFound breadcrumb="New check" message="Page not found">
        <div>
          <div>We&apos;re unable to find a check type that corresponds to the current URL.</div>
          <div>
            Are you trying to <TextLink href={getRoute(AppRoutes.ChooseCheckGroup)}>create a new check</TextLink>?
          </div>
        </div>
      </PluginPageNotFound>
    );
  }

  if (isLoading) {
    return <CenteredSpinner />;
  }

  return (
    <PluginPage pageNav={navModel}>
      <div className={styles.wrapper} data-testid={!isLoading ? DataTestIds.PAGE_READY : DataTestIds.PAGE_NOT_READY}>
        <ChecksterProvider
          checkType={checkType || CHECK_TYPE_GROUP_DEFAULT_CHECK[group.value]}
          disabled={isOverlimit || !canWriteChecks}
          onCheckTypeChange={handleCheckTypeChange}
          check={duplicateCheck}
          isDuplicate={!!duplicateCheck}
        >
          <Checkster onSave={handleSubmit} />
        </ChecksterProvider>
      </div>
    </PluginPage>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
