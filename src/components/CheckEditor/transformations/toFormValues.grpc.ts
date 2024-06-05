import { CheckFormValuesGRPC, CheckType, GRPCCheck, GRPCSettingsFormValues } from 'types';
import { getBaseFormValuesFromCheck } from 'components/CheckEditor/transformations/toFormValues.utils';

export function getGRPCCheckFormValues(check: GRPCCheck): CheckFormValuesGRPC {
  const base = getBaseFormValuesFromCheck(check);

  return {
    ...base,
    checkType: CheckType.GRPC,
    settings: {
      grpc: getGRPCSettingsFormValues(check.settings),
    },
  };
}

const getGRPCSettingsFormValues = (settings: GRPCCheck['settings']): GRPCSettingsFormValues => {
  return {
    ipVersion: settings.grpc?.ipVersion,
    service: settings.grpc?.service,
    tls: settings.grpc?.tls,
    tlsConfig: settings.grpc?.tlsConfig,
  };
};
