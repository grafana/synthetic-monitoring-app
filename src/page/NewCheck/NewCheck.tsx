import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { GrafanaTheme2 } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { TextLink, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import { DataTestIds } from 'test/dataTestIds';

import { CheckFormPageParams } from 'types';
import { createNavModel } from 'utils';
import { AppRoutes } from 'routing/types';
import { generateRoutePath, getRoute } from 'routing/utils';
import { CHECK_TYPE_GROUP_OPTIONS, useCheckTypeGroupOption } from 'hooks/useCheckTypeGroupOptions';
import { CheckForm } from 'components/CheckForm/CheckForm';
import { CheckFormContextProvider, useCheckFormMetaContext } from 'components/CheckForm/CheckFormContext';
import { PluginPageNotFound } from 'page/NotFound';

import { PageActions } from '../../components/CheckForm/PageActions';

export function NewCheck() {
  return (
    <CheckFormContextProvider>
      <NewCheckContent />
    </CheckFormContextProvider>
  );
}

export const NewCheckContent = () => {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const { isLoading } = useCheckFormMetaContext();
  const checkTypeGroupOption = useCheckTypeGroupOption(checkTypeGroup);
  const group = CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup);
  const styles = useStyles2(getStyles);
  const navModel = createNavModel({ text: `Choose a check type`, url: generateRoutePath(AppRoutes.ChooseCheckGroup) }, [
    { text: `${checkTypeGroupOption?.label ?? 'Check not found'}` },
  ]);

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
    <PluginPage pageNav={navModel} actions={<PageActions />}>
      <div className={styles.wrapper} data-testid={!isLoading ? DataTestIds.PAGE_READY : DataTestIds.PAGE_NOT_READY}>
        <CheckForm key={isLoading ? `loading` : `ready`} />
      </div>
    </PluginPage>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  wrapper: css({
    paddingTop: theme.spacing(2),
    height: `100%`,
  }),
});
