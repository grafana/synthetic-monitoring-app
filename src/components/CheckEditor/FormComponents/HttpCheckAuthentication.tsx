import React, { useCallback, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { BasicAuth, CheckFormValuesHttp } from 'types';

import { HttpCheckBasicAuthorization } from './HttpCheckBasicAuthorization';
import { HttpCheckBearerToken } from './HttpCheckBearerToken';

type HttpAuthType = 'none' | 'bearer' | 'basic';

export const HttpCheckAuthentication = ({ disabled }: { disabled?: boolean }) => {
  const styles = useStyles2(getStyles);

  const { getValues, setValue } = useFormContext<CheckFormValuesHttp>();

  const isBasicAuth = Boolean(
    getValues(`settings.http.basicAuth.username`) || Boolean(getValues(`settings.http.basicAuth.password`))
  );
  const isBearerAuth = Boolean(getValues(`settings.http.bearerToken`));

  const [authType, setAuthType] = useState<HttpAuthType>(isBasicAuth ? 'basic' : isBearerAuth ? 'bearer' : 'none');

  const bearerTokenRef = useRef<string | undefined>(undefined);
  const basicAuthRef = useRef<BasicAuth | undefined>(undefined);

  const storeBearerTokenValue = useCallback(() => {
    if (getValues('settings.http.bearerToken')) {
      bearerTokenRef.current = getValues('settings.http.bearerToken');
    }
  }, [getValues]);

  const storeBasicAuthValue = useCallback(() => {
    if (getValues('settings.http.basicAuth')) {
      basicAuthRef.current = getValues('settings.http.basicAuth');
    }
  }, [getValues]);

  const handleChangeOption = (newValue: HttpAuthType) => {
    setAuthType(newValue);

    //going from none|basic to bearer
    if (newValue === 'bearer') {
      storeBasicAuthValue();

      //clean basicAuth input
      setValue('settings.http.basicAuth', undefined);

      //restore bearer value from ref
      setValue('settings.http.bearerToken', bearerTokenRef.current);
    }

    //going from none|bearer to basic
    if (newValue === 'basic') {
      storeBearerTokenValue();

      //clean bearer input
      setValue('settings.http.bearerToken', undefined);

      //restore basicAuth value from ref
      setValue('settings.http.basicAuth', basicAuthRef.current);
    }

    //going from bearer|basic to none
    if (newValue === 'none') {
      storeBasicAuthValue();
      storeBearerTokenValue();

      //clean bearer input
      setValue('settings.http.bearerToken', undefined);
      //clean basicAuth input
      setValue('settings.http.basicAuth', undefined);
    }
  };

  return (
    <>
      <RadioButtonGroup
        disabled={disabled}
        onChange={handleChangeOption}
        options={[
          { label: 'None', value: 'none' },
          { label: 'Bearer', value: 'bearer' },
          { label: 'Basic', value: 'basic' },
        ]}
        value={authType}
      />

      <div className={styles.fieldsContainer}>
        {authType === 'bearer' && <HttpCheckBearerToken disabled={disabled} />}
        {authType === 'basic' && <HttpCheckBasicAuthorization disabled={disabled} />}
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
