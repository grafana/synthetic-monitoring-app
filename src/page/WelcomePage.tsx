import React, { FC } from 'react';
import { Button } from '@grafana/ui';
import { config, getBackendSrv } from '@grafana/runtime';
import { AppPluginMeta } from '@grafana/data';
import { GlobalSettings } from 'types';

interface Props {
  meta: AppPluginMeta<GlobalSettings>;
}

export const WelcomePage: FC<Props> = ({ meta }) => {
  const onClick = async () => {
    // try {
    //   const response = await getBackendSrv().console.log(response);
    // } catch (e) {
    //   console.log(e);
    // }
    const response = await getBackendSrv().request({
      url: `${meta.baseUrl}/register/init`,
      method: 'POST',
      data: meta.jsonData,
    });

    // await getBackendSrv().post('api/datasources', {
    //   name: 'Synthetic Monitoring',
    //   type: 'synthetic-monitoring-datasource',
    //   access: 'proxy',
    //   isDefault: false,
    // });
    // console.log(response);
    console.log('secure', meta.secureJsonData);
    console.log('not secure', meta.jsonData);
  };

  return (
    <div>
      <h1>Welcome to Synthetic Monitoring</h1>
      <Button onClick={onClick}>Start</Button>
    </div>
  );
};
