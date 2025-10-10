import React, { useMemo } from 'react';
import { useParams, useSearchParams } from 'react-router-dom-v5-compat';
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
import { Checkster } from 'components/Checkster';
import { PluginPageNotFound } from 'page/NotFound';

export function NewCheckV2() {
  const [params] = useSearchParams({});
  const checkType = params.get('checkType');
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const { isLoading: isLoadingProbes, isFetched: isProbesFetched } = useProbes();
  const checkTypeGroupOption = useCheckTypeGroupOption(checkTypeGroup);
  const group = CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup);
  const styles = useStyles2(getStyles);
  const navModel = createNavModel({ text: `Choose a check type`, url: generateRoutePath(AppRoutes.ChooseCheckGroup) }, [
    { text: `${checkTypeGroupOption?.label ?? 'Check not found'}` },
  ]);

  const instrumentation = useMemo(() => {
    return {
      type: (checkType as CheckType) || undefined,
      group: checkTypeGroup,
    };
  }, [checkType, checkTypeGroup]);

  const isLoading = isLoadingProbes && !isProbesFetched;

  const handleSubmit = useHandleSubmitCheckster();

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

  return (
    <PluginPage pageNav={navModel}>
      <div className={styles.wrapper} data-testid={!isLoading ? DataTestIds.PAGE_READY : DataTestIds.PAGE_NOT_READY}>
        <Checkster check={instrumentation} onSave={handleSubmit} />
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
