import { Alert, Button, Modal, useStyles2 } from '@grafana/ui';
import { config as runtimeConfig } from '@grafana/runtime';
import { InstanceContext } from 'contexts/InstanceContext';
import React, { useContext, useState } from 'react';
import { Clipboard } from 'components/Clipboard';
import { css } from '@emotion/css';
import { GrafanaTheme2 } from '@grafana/data';
import { TFCheckConfig, TFConfig, TFProbeConfig, TFOutput } from './terraformTypes';
import { checkToTF, probeToTF, sanitizeName } from './terraformConfigUtils';
import { checkType } from 'utils';
import { CheckType } from 'types';

const getStyles = (theme: GrafanaTheme2) => ({
  modal: css`
    max-height: 100%;
  `,
  clipboard: css`
    max-height: 500px;
    margin-top: 10px;
    margin-bottom: 10px;
  `,
  text: css`
    max-width: 600px;
  `,
  vericalSpace: css`
    margin-top: 10px;
    margin-bottom: 10px;
  `,
});

export const TerraformConfig = () => {
  const { instance } = useContext(InstanceContext);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [config, setConfig] = useState<TFConfig | undefined>();
  const [checkCommands, setCheckCommands] = useState<string[]>([]);
  const styles = useStyles2(getStyles);

  const generateTFConfig = async (): Promise<TFOutput> => {
    const checks = await instance.api?.listChecks();
    const probes = await instance.api?.listProbes();
    if (!checks || !probes) {
      throw new Error("Couldn't generate TF config");
    }
    const checksConfig = checks?.reduce<TFCheckConfig>((acc, check) => {
      const checkConfig = checkToTF(check);
      const resourceName = sanitizeName(`${check.job}_${check.target}`);
      if (!acc[resourceName]) {
        acc[resourceName] = checkConfig;
      } else {
        throw new Error(`Cannot generate TF config for checks with duplicate resource names: ${resourceName}`);
      }
      return acc;
    }, {});

    const probesConfig = probes?.reduce<TFProbeConfig>((acc, probe) => {
      if (probe.public) {
        return acc;
      }
      const probeConfig = probeToTF(probe);
      const sanitizedName = sanitizeName(probe.name);
      if (!acc[sanitizedName]) {
        acc[sanitizedName] = probeConfig;
      } else {
        throw new Error(`Cannot generate TF config for probes with duplicate probe names: ${probe.name}`);
      }
      return acc;
    }, {});

    const config: TFConfig = {
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
      resource: {},
    };

    if (Object.keys(checksConfig).length > 0) {
      config.resource.grafana_synthetic_monitoring_check = checksConfig;
    }
    if (Object.keys(probesConfig).length > 0) {
      config.resource.grafana_synthetic_monitoring_probe = probesConfig;
    }

    const checkCommands = checks.map((check) => {
      return `terraform import grafana_synthetic_monitoring_check.${sanitizeName(`${check.job}_${check.target}`)} ${
        check.id
      }`;
    });

    return { config, checkCommands };
  };

  const showConfigModal = async () => {
    try {
      const { config, checkCommands } = await generateTFConfig();
      setConfig(config);
      setCheckCommands(checkCommands);
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
      <Button className={styles.vericalSpace} onClick={() => showConfigModal()}>
        Generate config
      </Button>
      <Modal
        title="Terraform config"
        isOpen={showModal}
        onDismiss={() => setShowModal(false)}
        contentClassName={styles.modal}
      >
        {error && <Alert title={error} />}
        {config && (
          <>
            <Alert title="Terraform and JSON" severity="info">
              The exported config is using{' '}
              <a href="https://www.terraform.io/docs/language/syntax/json.html">Terraform JSON syntax</a>. You can place
              this config in a file with a <strong>tf.json</strong> extension and import as a module.
            </Alert>
            <h5>tf.json</h5>
            <Clipboard content={JSON.stringify(config, null, 2)} className={styles.clipboard} />
            <h5>Import existing checks into Terraform</h5>
            <Clipboard content={checkCommands.join(' && ')} className={styles.clipboard} truncate />
            <h5>Import custom probes into Terraform</h5>
            <Clipboard
              content="terraform import grafana_synthetic_monitoring_probe.{{probe_name}} {{probe_id}}"
              className={styles.clipboard}
            />
          </>
        )}
      </Modal>
    </div>
  );
};
