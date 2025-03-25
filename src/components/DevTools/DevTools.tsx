import React, { ChangeEvent, Fragment, ReactNode, useMemo, useState } from 'react';
import { FeatureToggles, GrafanaTheme2 } from '@grafana/data';
import { config } from '@grafana/runtime';
import { Field, Icon, Modal, Switch, useStyles2 } from '@grafana/ui';
import { css } from '@emotion/css';
import useKonami from 'use-konami';
import { useSessionStorage } from 'usehooks-ts';

import { FeatureName } from 'types';

import packageJson from '../../../package.json';
import { DEV_STORAGE_KEYS } from './DevTools.constants';

interface DevToolsProps {
  children: ReactNode;
}

const FEATURE_MAP = Object.entries(FeatureName).reduce<{ [k: string]: keyof typeof FeatureName }>(
  (acc, [key, value]) => {
    if (value === FeatureName.__TURNOFF) {
      return acc;
    }

    acc[value] = key as keyof typeof FeatureName;
    return acc;
  },
  {}
);

function DevToolsComponent({ children }: DevToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const styles = useStyles2(getStyles);
  const [confirmLeavingPageOverride, setConfirmLeavingPageOverride, deleteConfirmLeavingPageOverride] =
    useSessionStorage(DEV_STORAGE_KEYS.confirmLeavingPageOverride, false, {
      initializeWithValue: false,
    });

  useKonami({
    onUnlock: () => setIsOpen(true),
  });

  const handleDisableConfirmLeavingPage = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setConfirmLeavingPageOverride(event.target.checked);
    } else {
      deleteConfirmLeavingPageOverride();
    }
  };

  const handleDismiss = () => setIsOpen(false);

  const featureToggles = useMemo(() => {
    return Object.entries(FEATURE_MAP).reduce<Array<[string, boolean]>>((acc, [key, value]) => {
      if (key in config.featureToggles) {
        acc.push([value, Boolean(config.featureToggles[key as keyof FeatureToggles])]);
      } else {
        acc.push([value, false]);
      }
      return acc;
    }, []);
  }, []);

  return (
    <>
      {children}
      <Modal isOpen={isOpen} title="Dev Tools" onDismiss={handleDismiss}>
        <div className={styles.layout}>
          <div>
            <h3 className={styles.h3}>Tools</h3>
            <Field
              label="Confirm on navigation override!"
              description="Enable to prevent confirmation dialog on hot reload"
            >
              <Switch onChange={handleDisableConfirmLeavingPage} value={confirmLeavingPageOverride} />
            </Field>
          </div>

          <div className={styles.rightAside}>
            <h3 className={styles.h3}>Feature toggles</h3>
            <div className={styles.featureToggles.container}>
              {featureToggles.map(([feature, value]) => (
                <div className={styles.featureToggles.row} key={feature}>
                  <code>{feature}</code>{' '}
                  {value ? <Icon name="check" color="green" /> : <Icon name="times" color="red" />}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.appVersion}>
          {packageJson.name} v{packageJson.version}
        </div>
      </Modal>
    </>
  );
}

export const DevTools = process.env.NODE_ENV === 'development' ? DevToolsComponent : Fragment;

function getStyles(theme: GrafanaTheme2) {
  return {
    featureToggles: {
      container: css`
        display: flex;
        gap: ${theme.spacing(1)};
        flex-direction: column;
      `,
      row: css`
        display: flex;
        gap: ${theme.spacing(1)};
        justify-content: space-between;
      `,
    },
    appVersion: css`
      text-align: right;
      margin-top: ${theme.spacing(2)};
      font-size: ${theme.typography.bodySmall.fontSize};
      color: ${theme.colors.text.secondary};
    `,
    h3: css`
      font-size: ${theme.typography.h5.fontSize};
    `,
    layout: css`
      display: flex;
      gap: ${theme.spacing(2)};
      flex-wrap: wrap;
      justify-content: space-between;
    `,
    rightAside: css`
      flex: 0 0 250px;
    `,
  };
}
