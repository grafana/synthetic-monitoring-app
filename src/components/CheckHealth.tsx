import React, { useState, useEffect, FC } from 'react';
import { IconName, Icon } from '@grafana/ui';
import { DataSourceInstanceSettings } from '@grafana/data';
import { Check } from 'types';
import { queryMetric } from 'utils';

interface CheckHealthProps {
  ds: DataSourceInstanceSettings;
  check: Check;
}

const getIconClassName = (uptime: number) => {
  if (uptime < 50) {
    return 'critical';
  }
  if (uptime < 99) {
    return 'warning';
  }
  return 'ok';
};

interface Icon {
  iconName: IconName;
  className: string;
}

export const CheckHealth: FC<CheckHealthProps> = ({ check, ds }) => {
  const [{ iconName, className }, setIcon] = useState<Icon>({ iconName: 'heart', className: 'paused' });

  useEffect(() => {
    const getData = async (url: string) => {
      const { error, data } = await queryMetric(url, query);

      if (error) {
        setIcon({ iconName: 'exclamation-triangle', className: 'critical' });
        return;
      }

      if (!data || data.length < 1) {
        setIcon({ iconName: 'question-circle', className: 'paused' });
        return;
      }

      const uptime = parseFloat(data[0].value[1]) * 100;
      const iconName = uptime < 50 ? 'heart-break' : 'heart';

      setIcon({ iconName, className: getIconClassName(uptime) });
    };

    if (!check.enabled) {
      setIcon({ iconName: 'pause', className: 'paused' });
    }
    const filter = `instance="${check.target}", job="${check.job}"`;
    const query = `sum(probe_success{${filter}}) / count(probe_success{${filter}})`;

    if (!ds.url) {
      return;
    }

    getData(ds.url);
  }, [check, ds.url]);

  return <Icon name={iconName} size="xxl" className={`alert-rule-item__icon alert-state-${className}`} />;
};
