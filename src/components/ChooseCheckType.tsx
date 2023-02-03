import React, { useState, useMemo, useContext } from 'react';
import { useParams, useHistory } from 'react-router-dom';

import { css } from '@emotion/css';
import { Card, useStyles2, VerticalGroup } from '@grafana/ui';
import { GrafanaTheme2, OrgRole } from '@grafana/data';
import { Check, CheckType, CheckFormValues, FeatureName, CheckPageParams, ROUTES } from 'types';
import { hasRole } from 'utils';
import { getDefaultValuesFromCheck } from 'components/CheckEditor/checkFormTransformations';
import { CHECK_TYPE_OPTIONS, fallbackCheck } from 'components/constants';
import { useForm } from 'react-hook-form';
import { InstanceContext } from 'contexts/InstanceContext';
import { useFeatureFlag } from 'hooks/useFeatureFlag';
import { useNavigation } from 'hooks/useNavigation';

interface Props {
  checks?: Check[];
  onReturn: (reload: boolean) => void;
}
export function ChooseCheckType({ checks }: Props) {
  const {
    instance: { api },
  } = useContext(InstanceContext);
  const history = useHistory();

  // If we're editing, grab the appropriate check from the list
  const { id } = useParams<CheckPageParams>();
  let check: Check = fallbackCheck;
  if (id) {
    check = checks?.find((c) => c.id === Number(id)) ?? fallbackCheck;
  }
  const styles = useStyles2(getStyles);
  const defaultValues = useMemo(() => getDefaultValuesFromCheck(check), [check]);
  const { isEnabled: tracerouteEnabled } = useFeatureFlag(FeatureName.Traceroute);
  const { isEnabled: multiHttpEnabled } = useFeatureFlag(FeatureName.MultiHttp);
  const formMethods = useForm<CheckFormValues>({ defaultValues, mode: 'onChange' });
  const [selectedCheckType, setSelectedCheckType] = useState<CheckFormValues['checkType']>();
  const isEditor = hasRole(OrgRole.Editor);
  const navigate = useNavigation();

  const options = !tracerouteEnabled
    ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.Traceroute)
    : !multiHttpEnabled
    ? CHECK_TYPE_OPTIONS.filter(({ value }) => value !== CheckType.MULTI_HTTP)
    : CHECK_TYPE_OPTIONS;

  React.useEffect(() => {
    selectedCheckType &&
      navigate(
        selectedCheckType.value === CheckType.MULTI_HTTP ? ROUTES.NewCheckMulti : ROUTES.NewCheck,
        {},
        false,
        selectedCheckType
      );
  });

  return (
    <div className={styles.container}>
      <h2>Choose check type</h2>
      <VerticalGroup>
        {options?.map((check) => {
          return (
            <Card
              key={check?.label || ''}
              className={styles.cards}
              onClick={() => {
                setSelectedCheckType(check);
              }}
            >
              <Card.Heading>{check.label}</Card.Heading>
            </Card>
          );
        })}
      </VerticalGroup>
    </div>
  );
}

const getStyles = (theme: GrafanaTheme2) => ({
  container: css`
    justify-content: space-between;
    width: 50vw;
    margin: ${theme.spacing(3)};
    padding: ${theme.spacing(2)};
    place-items: center;
    align-items: center;
    justify-content: center;
  `,
  cards: css`
    width: 100%;
    margin: ${theme.spacing(1)};
  `,
});
