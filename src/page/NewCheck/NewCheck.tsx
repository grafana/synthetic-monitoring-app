import React from 'react';
import { useParams } from 'react-router-dom';

import { CheckFormPageParams } from 'types';
import { CHECK_TYPE_GROUP_OPTIONS } from 'hooks/useCheckTypeGroupOptions';
import { CheckForm } from 'components/CheckForm/CheckForm';

export const NewCheck = () => {
  const { checkTypeGroup } = useParams<CheckFormPageParams>();
  const group =
    CHECK_TYPE_GROUP_OPTIONS.find((option) => option.value === checkTypeGroup) || CHECK_TYPE_GROUP_OPTIONS[0];

  const pageTitle = `New ${group.label} check`;

  return <CheckForm pageTitle={pageTitle} />;
};
