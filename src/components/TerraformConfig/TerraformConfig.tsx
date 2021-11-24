import { Alert, Button, Link, Modal, useStyles2 } from '@grafana/ui';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext, useState } from 'react';
import { Clipboard } from 'components/Clipboard';
import { checkType } from 'utils';
import { css } from '@emotion/css';
import { CheckType } from 'types';
import { GrafanaTheme2 } from '@grafana/data';
import { TFCheckConfig, TFConfig } from './terraformTypes';
import { checkToTF } from './terraformConfigUtils';

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
    const probes = await instance.api?.listProbes();
    if (!checks || !probes) {
      throw new Error("Couldn't generate TF config");
    }
    const checksConfig = checks?.reduce<TFCheckConfig>((acc, check) => {
      const type = checkType(check.settings);
      if (type === CheckType.Traceroute) {
        return acc;
      }
      const checkConfig = checkToTF(check, probes ?? []);
      if (!acc[type]) {
        acc[type] = [checkConfig];
      } else {
        acc[type]?.push(checkConfig);
      }
      return acc;
    }, {});
    return {
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
              <Link href="https://www.terraform.io/docs/language/syntax/json.html">Terraform JSON syntax</Link>. Further
              information on how to use this config can be found{' '}
              <Link href="https://discuss.hashicorp.com/t/how-to-work-with-json/2345">here</Link>
            </Alert>
            <Clipboard content={JSON.stringify(config, null, 2)} className={styles.clipboard} />
          </>
        )}
      </Modal>
    </div>
  );
};
