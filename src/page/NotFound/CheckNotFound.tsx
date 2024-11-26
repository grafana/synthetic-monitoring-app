import React from 'react';
import { useParams } from 'react-router-dom-v5-compat';
import { TextLink } from '@grafana/ui';

import { createNavModel } from 'utils';
import { ROUTES } from 'routing/types';
import { generateRoutePath } from 'routing/utils';
import { useCheck } from 'data/useChecks';

import { NotFound, PluginPageNotFound } from './NotFound';

export function CheckNotFound() {
  const params = useParams();
  const { data: check, isLoading } = useCheck(Number(params.id));

  if (isLoading) {
    return null;
  }

  if (!check) {
    return (
      <NotFound message="Check not found">
        The check you&apos;re trying to view does not exist. Try the{' '}
        <TextLink href={generateRoutePath(ROUTES.Checks)}>checks page</TextLink> instead.
      </NotFound>
    );
  }

  const message = 'Page not found';

  const navModel = createNavModel(
    { text: check.job, url: generateRoutePath(ROUTES.CheckDashboard, { id: check?.id ?? 'new' }) },
    [{ text: message }]
  );

  return (
    <PluginPageNotFound navModel={navModel} message={message}>
      <div>
        We&apos;re unable to find the page you&apos;re looking for. Do you want to go to the{' '}
        <TextLink href={generateRoutePath(ROUTES.CheckDashboard, { id: check?.id ?? 'new' })}>check page</TextLink>?
      </div>
    </PluginPageNotFound>
  );
}
