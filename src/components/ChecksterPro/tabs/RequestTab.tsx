import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { Button, Collapse, Icon, Input, Select, Switch, Text, Tooltip, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ChecksterTypes } from '../types';

import { REQUEST_METHODS_OPTIONS } from '../constants';
import { getMethodColor } from '../utils';

export function RequestTab() {
  const theme = useTheme2();
  const [requestMethod, setRequestMethod] = useState<SelectableValue<ChecksterTypes.HTTPMethod>>(
    REQUEST_METHODS_OPTIONS[0]
  );

  const accentColor = theme.visualization.getColorByName(getMethodColor(requestMethod?.value ?? 'GET'));
  const styles = getStyles(theme, accentColor);
  const [isOpen, setIsOpen] = useState(false);
  const handleRequestMethodChange = (option: SelectableValue<ChecksterTypes.HTTPMethod>) => {
    setRequestMethod(option);
  };

  return (
    <div>
      <h4>Request</h4>
      <div className={styles.formRows}>
        <div className={styles.requestMethodContainer}>
          <Select
            className={styles.requestMethodSelect}
            value={requestMethod}
            options={REQUEST_METHODS_OPTIONS}
            onChange={handleRequestMethodChange}
          />
          <Input value="https://www.grafana.com/synthetic-monitoring/boom-boom-boom/checkster-pro?tab=Overview" />
          <Button variant="secondary">Test</Button>
          <Icon name="check-circle" />
        </div>

        <div className={styles.switchField}>
          <div>
            <span>Follow redirects</span>
          </div>
          <Switch value onChange={() => {}} />
          <Tooltip
            content={
              <div>
                <div className={styles.switchFieldHeading}>
                  <h6>Follow redirects</h6>
                  <Text element="span" variant="bodySmall" color="secondary">
                    Default: On
                  </Text>
                </div>
                <div>Automatically follow redirects when making requests.</div>
              </div>
            }
          >
            <Icon name="info-circle" />
          </Tooltip>
        </div>
      </div>
      <br />
      <h5>Headers</h5>
      <Button size="sm" icon="plus" variant="secondary">
        Add header
      </Button>
      <br />
      <br />
      <Collapse
        collapsible
        label={
          <div>
            Advanced options
            {!isOpen && (
              <>
                {' '}
                <Text element="span" variant="bodySmall" color="secondary">
                  IP VERSION, BODY, AUTHENTICATION, TLS, PROXY
                </Text>
              </>
            )}
          </div>
        }
        isOpen={isOpen}
        onToggle={() => setIsOpen(!isOpen)}
      >
        <h5>IP Version</h5>
        <h5>Body</h5>
        <h5>Authentication</h5>
        <h5>TLS</h5>
        <h5>Proxy</h5>
      </Collapse>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2, accentColor: string) => ({
  requestMethodSelect: css`
    color: ${accentColor};
    font-weight: 600;
    border-color: ${accentColor};
    width: 100px;
  `,
  requestMethodContainer: css`
    display: grid;
    align-items: center;
    grid-template-columns: 110px 1fr auto auto;
    border-left: 4px solid ${accentColor};
    padding: ${theme.spacing(1)};
    gap: ${theme.spacing(1)};
  `,
  formRows: css`
    display: flex;
    gap: ${theme.spacing(2)};
    flex-direction: column;
  `,

  switchField: css`
    display: flex;
    align-items: center;
    gap: ${theme.spacing(1)};
  `,
  switchFieldHeading: css`
    display: flex;
    gap: ${theme.spacing(1)};
    justify-content: space-between;
    align-items: center;
  `,
});
