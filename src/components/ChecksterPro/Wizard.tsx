import React, { useState } from 'react';
import { GrafanaTheme2, SelectableValue } from '@grafana/data';
import { PluginPage } from '@grafana/runtime';
import { Button, Collapse, Field, Input, Select, Text, useStyles2, useTheme2 } from '@grafana/ui';
import { css } from '@emotion/css';

import { ChecksterTypes } from './types';
import { createNavModel } from 'utils';

import { Preformatted } from '../Preformatted';
import { REQUEST_METHOD_DESCRIPTIONS, REQUEST_METHODS_OPTIONS } from './constants';
import { getMethodColor } from './utils';

function strFallback(str: string, fallback: string) {
  return str || fallback;
}

const JOB_PLACEHOLDER = 'my-check';
const TARGET_PLACEHOLDER = 'https://www.grafana.com';

export function Wizard() {
  const theme = useTheme2();
  const [requestMethod, setRequestMethod] = useState<SelectableValue<ChecksterTypes.HTTPMethod>>(
    REQUEST_METHODS_OPTIONS[0]
  );
  const accentColor = theme.visualization.getColorByName(getMethodColor(requestMethod?.value ?? 'GET'));
  const styles = useStyles2(getStyle, accentColor);

  // Fields
  const [job, setJob] = useState('');
  const [target, setTarget] = useState('');

  const [isOpen, setIsOpen] = useState(false);
  const handleRequestMethodChange = (option: SelectableValue<ChecksterTypes.HTTPMethod>) => {
    setRequestMethod(option);
  };

  return (
    <PluginPage
      pageNav={createNavModel({ text: 'Create check', subTitle: 'API Endpoint' })}
      actions={
        <div>
          <Button>Save</Button>
        </div>
      }
    >
      <div className={styles.layout}>
        <div>
          <h2>Request</h2>
          <div>
            <p>
              The combination of job name and request URL is how we identify metrics for a particular check. Changing
              any of these values will cause new metrics to not be associated with the previous metrics collected.
            </p>
            <p>
              In other words, it&apos;s ill advised to change these values after the check has been created, unless you
              really need to.
            </p>
          </div>

          <Field
            label="Job name"
            description={
              <>
                Used as Prometheus &quot;job&quot; label.{' '}
                <a href="https://grafana.com/docs/grafana-cloud/testing/synthetic-monitoring/analyze-results/?src=ggl-s&mdm=cpc&cnt=130224525351&camp=nb-synthetic-monitoring-pm&pg=synthetic-monitoring&plcmt=helpful-resources#explore-your-check-metrics">
                  Explore metrics
                </a>
              </>
            }
          >
            <div>
              <Input
                value={job}
                placeholder={JOB_PLACEHOLDER}
                onChange={({ currentTarget }) => setJob(currentTarget.value)}
              />
            </div>
          </Field>
          <Field label="Request" description="">
            <div className={styles.requestMethodContainer}>
              <Select
                className={styles.requestMethodSelect}
                value={requestMethod}
                options={REQUEST_METHODS_OPTIONS}
                onChange={handleRequestMethodChange}
              />
              <Input
                value={target}
                placeholder={TARGET_PLACEHOLDER}
                onChange={({ currentTarget }) => setTarget(currentTarget.value)}
              />
            </div>
          </Field>
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
        <div>
          <div className={styles.rightAside}>
            <div className={styles.infoCard}>
              <h5>Request summary</h5>
              <div>
                <span>Method: {requestMethod.value}</span>
                <div className={styles.mutedText}>
                  {REQUEST_METHOD_DESCRIPTIONS[requestMethod.value as ChecksterTypes.HTTPMethod]}
                </div>
              </div>
              <br />
              <Preformatted className={styles.preformatted}>
                <span className="preformatted_method">{requestMethod.value}</span>{' '}
                {strFallback(target, TARGET_PLACEHOLDER)}
              </Preformatted>
            </div>

            <div className={styles.infoCard}>
              <h5>
                Prometheus <code>job</code> and <code>instance</code> for this check
              </h5>
              <Preformatted className={styles.preformatted}>
                &#123; <span>job</span>=
                <span className="preformatted_str">&quot;{strFallback(job, JOB_PLACEHOLDER)}&quot;</span>,{' '}
                <span>instance</span>=
                <span className="preformatted_str">&quot;{strFallback(target, TARGET_PLACEHOLDER)}&quot;</span> &#125;
              </Preformatted>
              <p className={styles.mutedText}>
                Note: The same job name can be used in combination with a different target/instance
              </p>
            </div>
          </div>
        </div>
      </div>
    </PluginPage>
  );
}

function getStyle(theme: GrafanaTheme2, accentColor: string) {
  return {
    requestMethodContainer: css`
      display: grid;
      align-items: center;
      grid-template-columns: 110px 1fr auto auto;
      border-left: 4px solid ${accentColor};
      padding: ${theme.spacing(1)};
      gap: ${theme.spacing(1)};
    `,
    requestMethodSelect: css`
      color: ${accentColor};
      font-weight: 600;
      border-color: ${accentColor};
      width: 100px;
    `,
    layout: css`
      display: flex;
      flex-direction: row;
      gap: ${theme.spacing(2)};
      justify-content: space-between;
      & > div:first-of-type {
        flex: 0 1 860px;
      }
      & > div:last-of-type {
      }
    `,
    preformatted: css`
      & > span {
        color: ${theme.visualization.getColorByName('green')};
      }
      & > .preformatted_str {
        color: ${theme.visualization.getColorByName('DarkSalmon')};
      }

      & > .preformatted_method {
        color: ${accentColor};
      }
    `,
    rightAside: css`
      max-width: 400px;
    `,
    mutedText: css`
      color: ${theme.colors.text.secondary};
    `,
    infoCard: css`
      background-color: ${theme.colors.background.secondary};
      padding: ${theme.spacing(2)};
      margin-bottom: ${theme.spacing(2)};
    `,
    methodDescription: css`
      color: ${accentColor};
    `,
  };
}
