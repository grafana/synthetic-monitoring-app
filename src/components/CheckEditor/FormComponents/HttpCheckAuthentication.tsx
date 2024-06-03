import React, { useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesHttp, HttpAuthType } from 'types';

import { HttpCheckBasicAuthorization } from './HttpCheckBasicAuthorization';
import { HttpCheckBearerToken } from './HttpCheckBearerToken';

export const HttpCheckAuthentication = () => {
  const styles = useStyles2(getStyles);

  const { getValues, setValue } = useFormContext<CheckFormValuesHttp>();

  const isBasicAuth = Boolean(
    getValues(`settings.http.basicAuth.username`) || Boolean(getValues(`settings.http.basicAuth.password`))
  );

  const isBearerAuth = Boolean(getValues(`settings.http.bearerToken`));

  const authType = getValues('settings.http.authType');

  useEffect(() => {
    if (isBasicAuth) {
      setValue('settings.http.authType', 'basic');
      return;
    }
    if (isBearerAuth) {
      setValue('settings.http.authType', 'bearer');
      return;
    }
    setValue('settings.http.authType', 'none');
  }, [isBasicAuth, isBearerAuth, setValue]);

  const handleChangeOption = (value: HttpAuthType) => {
    setValue('settings.http.authType', value);
  };

  return (
    <>
      <RadioButtonGroup
        options={[
          { label: 'None', value: 'none' },
          { label: 'Bearer', value: 'bearer' },
          { label: 'Basic', value: 'basic' },
        ]}
        value={authType}
        onChange={handleChangeOption}
      />

      <div className={styles.fieldsContainer}>
        {authType === 'bearer' && <HttpCheckBearerToken />}
        {authType === 'basic' && <HttpCheckBasicAuthorization />}
      </div>
    </>
  );
};

const getStyles = (theme: GrafanaTheme2) => ({
  fieldsContainer: css({
    display: `flex`,
    gap: theme.spacing(1),
    marginTop: theme.spacing(2),
  }),
});
