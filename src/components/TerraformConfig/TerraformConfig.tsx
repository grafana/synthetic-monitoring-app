import { Alert, Button, Link, Modal, useStyles2 } from '@grafana/ui';
import { config as runtimeConfig } from '@grafana/runtime';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext, useState } from 'react';
import { Clipboard } from 'components/Clipboard';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { TFCheckConfig, TFConfig } from './terraformTypes';
import { checkToTF, sanitizeJobName } from './terraformConfigUtils';
import { checkType } from 'utils';
import { CheckType } from 'types';

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    max-height: 100%;
  `,
  clipboard: css`
    max-height: 500px;
  `,
  text: css`
    max-width: 600px;
  `,
});

export const TerraformConfig = () => {
  const { instance } = useContext(InstanceContext);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [config, setConfig] = useState<TFConfig | undefined>();
  const styles = useStyles2(getStyles);

  const generateTFConfig = async (): Promise<TFConfig> => {
    const checks = await instance.api?.listChecks();
    if (!checks) {
      throw new Error("Couldn't generate TF config");
    }
    const checksConfig = checks?.reduce<TFCheckConfig>((acc, check) => {
      const type = checkType(check.settings);
      if (type === CheckType.Traceroute) {
        return acc;
      }
      const checkConfig = checkToTF(check);
      const formattedJob = sanitizeJobName(check.job);
      if (!acc[formattedJob]) {
        acc[formattedJob] = checkConfig;
      } else {
        throw new Error(`Cannot generate TF config for checks with duplicate job names: ${check.job}`);
      }
      return acc;
    }, {});
    return {
      terraform: {
        required_providers: {
          grafana: {
            source: 'grafana/grafana',
          },
        },
      },
      provider: {
        grafana: {
          url: runtimeConfig.appUrl,
          auth: '<add an api key from grafana.com>',
          sm_url: instance.api?.instanceSettings.jsonData.apiHost ?? '<ADD SM API URL>',
          sm_access_token: '<add an sm access token>',
        },
      },
      resource: {
        grafana_synthetic_monitoring_check: {
          ...checksConfig,
        },
      },
    };
  };

  const showConfigModal = async () => {
    try {
      const configGen = await generateTFConfig();
      setConfig(configGen);
    } catch (e) {
      const cast = e as Error;
      setError(cast?.message ?? 'There was an error creating the terraform config');
    }
    setShowModal(true);
  };

  return (
    <div>
      <h5>Terraform</h5>
      <div>You can manage synthetic monitoring checks via Terraform. Export your current checks as config</div>
      <Button onClick={() => showConfigModal()}>Generate config</Button>
      <Modal
        title="Terraform config"
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        contentClassName={styles.modal}
      >
        {error && <Alert title={error} />}
        {config && (
          <>
            <Alert title="Traceroute checks" severity="warning">
              Traceroute checks are not yet supported by the Grafana Terraform provider. They have been ignored from the
              generated config.
            </Alert>
            <Alert title="Terraform and JSON" severity="info">
              The exported config is using{' '}
              <a href="https://www.terraform.io/docs/language/syntax/json.html">Terraform JSON syntax</a>. You can place
              this config in a <pre>{'<filename>.tf.json'}</pre> and import as a module.
            </Alert>
            <Clipboard content={JSON.stringify(config, null, 2)} className={styles.clipboard} />
          </>
        )}
      </Modal>
    </div>
  );
};
