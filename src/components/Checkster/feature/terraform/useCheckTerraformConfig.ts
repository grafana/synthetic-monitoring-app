import { CheckFormValues } from 'types';
import { alertsToTF, checkToTF, generateCheckResourceName } from 'components/TerraformConfig/terraformConfigUtils';
import { jsonToHcl } from 'components/TerraformConfig/terraformJsonToHcl';
import { TFConfig } from 'components/TerraformConfig/terraformTypes';

import { getAlertsPayload } from '../../transformations/toPayload.alerts';
import { toPayload } from '../../utils/adaptors';

interface CheckTerraformConfig {
  jsonConfig: string;
  hclConfig: string;
  resourceName: string;
}

export function useCheckTerraformConfig(formValues: CheckFormValues): CheckTerraformConfig {
  try {
    const check = toPayload(formValues);
    const tfCheck = checkToTF(check);
    const resourceName = generateCheckResourceName(check);

    const alerts = getAlertsPayload(formValues.alerts, check.id);
    const tfAlerts = alertsToTF(alerts);

    const config: Partial<TFConfig> = {
      resource: {
        grafana_synthetic_monitoring_check: {
          [resourceName]: tfCheck,
        },
      },
    };

    if (tfAlerts.length > 0) {
      config.resource!.grafana_synthetic_monitoring_check_alerts = {
        [resourceName]: {
          check_id: `${check.id}`,
          alerts: tfAlerts,
        },
      };
    }

    const hclConfig = jsonToHcl(config as TFConfig);
    const jsonConfig = JSON.stringify(config.resource, null, 2);

    return {
      jsonConfig,
      hclConfig,
      resourceName,
    };
  } catch {
    // Return empty config if conversion fails (e.g., form is in invalid state)
    return {
      jsonConfig: '',
      hclConfig: '',
      resourceName: '',
    };
  }
}
