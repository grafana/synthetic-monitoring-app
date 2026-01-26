import { screen } from '@testing-library/react';
import { UserEvent } from '@testing-library/user-event/index';
import { PRIVATE_PROBE } from 'test/fixtures/probes';

import { CheckType } from 'types';
import { gotoSection } from 'components/Checkster/__testHelpers__/formHelpers';
import { FormSectionName } from 'components/Checkster/types';

const TARGET_MAP = {
  [CheckType.Dns]: 'grafana.com',
  [CheckType.Grpc]: 'grafana.com:50051',
  [CheckType.Http]: 'https://grafana.com/',
  [CheckType.MultiHttp]: 'https://grafana.com/',
  [CheckType.Ping]: 'grafana.com',
  [CheckType.Scripted]: 'Whatever string we would like',
  [CheckType.Browser]: 'Whatever string we would like',
  [CheckType.Tcp]: 'grafana.com:80',
  [CheckType.Traceroute]: 'grafana.com',
};

export async function fillMandatoryFields({
  user,
  checkType,
  fieldsToOmit = [],
}: {
  user: UserEvent;
  checkType: CheckType;
  fieldsToOmit?: string[];
}) {
  await gotoSection(user, FormSectionName.Check);
  if (!fieldsToOmit.includes('job')) {
    const jobField = screen.getByLabelText(/Job name/);
    await user.type(jobField, 'JOB FIELD');
  }

  if (!fieldsToOmit.includes('target')) {
    const targetSelector = [CheckType.Scripted, CheckType.Browser].includes(checkType) ? /Instance/ : /Request target/;
    const targetField = screen.getByLabelText(targetSelector);
    await user.type(targetField, TARGET_MAP[checkType]);
  }
  if (!fieldsToOmit.includes('probes')) {
    await gotoSection(user, FormSectionName.Execution);
    const probeCheckbox = await screen.findByLabelText(PRIVATE_PROBE.name, { exact: false });
    await user.click(probeCheckbox);
  }
}
