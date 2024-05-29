import React, { useState } from 'react';
import { useFormContext } from 'react-hook-form';
import { GrafanaTheme2 } from '@grafana/data';
import { RadioButtonGroup, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { CheckFormValuesHttp } from 'types';

import { HttpCheckBasicAuthorization } from './HttpCheckBasicAuthorization';
import { HttpCheckBearerToken } from './HttpCheckBearerToken';

type AuthType = 'none' | 'bearer' | 'basic';

export const HttpCheckAuthentication = () => {
  const styles = useStyles2(getStyles);

  const [selectedOption, setSelectedOption] = useState<AuthType>('none');
  const { setValue } = useFormContext<CheckFormValuesHttp>();

  const handleChangeOption = (value: AuthType) => {
    setSelectedOption(value);
    setValue('settings.http.bearerToken', '');
    setValue('settings.http.basicAuth.username', '');
    setValue('settings.http.basicAuth.password', '');
  };

  return (
    <>
      <RadioButtonGroup
        options={[
          { label: 'None', value: 'none' },
          { label: 'Bearer', value: 'bearer' },
          { label: 'Basic', value: 'basic' },
        ]}
        value={selectedOption}
        onChange={handleChangeOption}
      />

      <div className={styles.fieldsContainer}>
        {selectedOption === 'bearer' && <HttpCheckBearerToken />}
        {selectedOption === 'basic' && <HttpCheckBasicAuthorization />}
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
