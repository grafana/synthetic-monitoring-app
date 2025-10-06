import React from 'react';

import { CheckFormFieldPath } from '../../../types';

import { AdditionalSettings } from '../../AdditionalSettings';
import { SectionContent } from '../../ui/SectionContent';
import { ChooseCheckType } from '../ChooseCheckType';
import { FormHttpAuthenticationField } from '../FormHttpAuthenticationField';
import { FormHttpRequestMethodTargetFields } from '../FormHttpRequestMethodTargetFields';
import { FormIpVersionRadioField } from '../FormIpVersionRadioField';
import { FormJobField } from '../FormJobField';
import { FormTabContent, FormTabs } from '../FormTabs';
import { FormTLSConfigField } from '../FormTLSConfigField';
import { GenericCheckboxField } from '../generic/GenericCheckboxField';
import { GenericInputField } from '../generic/GenericInputField';
import { GenericNameValueField } from '../generic/GenericNameValueField';
import { GenericTextareaField } from '../generic/GenericTextareaField';

export const HTTP_CHECK_FIELDS_MAP: Record<string, CheckFormFieldPath> = {
  job: 'job',
  target: 'target',
  cacheBustingQueryParamName: 'settings.http.cacheBustingQueryParamName',
  headers: 'settings.http.headers',
  followRedirects: 'settings.http.followRedirects',
  ipVersion: 'settings.http.ipVersion',
  body: 'settings.http.body',
  basicAuth: 'settings.http.basicAuth',
  proxyURL: 'settings.http.proxyURL',
  proxyConnectHeaders: 'settings.http.proxyConnectHeaders',
};

export function HttpCheckSection() {
  return (
    <SectionContent>
      <FormJobField field="job" />

      <ChooseCheckType />

      {/* TODO: Would be nice to write root fields like `.target` (instead of `target`) */}
      <FormHttpRequestMethodTargetFields field="target" methodField="settings.http.method" withQueryParams />

      <AdditionalSettings indent buttonLabel="Request options">
        <FormTabs>
          <FormTabContent label="Options">
            {/* TODO: Would be nice to write settings fields like `headers` (instead of `settings.http.headers`)*/}
            {/* TODO: Revisit if it's worth storing the check type as a key in the form settings? */}

            <GenericInputField
              field="settings.http.cacheBustingQueryParamName"
              label="Cache busting query parameter"
              description="Name of the query parameter that prevents cached responses. Each probe assigns a random value to this parameter for every request."
              placeholder="cache-bust"
            />

            <GenericNameValueField
              label="Request headers"
              description="The HTTP headers to be sent with the request."
              allowEmpty
              field="settings.http.headers"
              addButtonText="Header"
              interpolationVariables={{ type: 'Header' }}
            />

            <GenericCheckboxField
              field="settings.http.followRedirects"
              label="Follow redirects"
              description="Follow HTTP redirects instead of stopping at the first response."
            />

            <FormIpVersionRadioField
              field="settings.http.ipVersion"
              description="The IP protocol of the HTTP request."
            />
          </FormTabContent>

          <FormTabContent label="Body">
            <GenericTextareaField
              label="Request body"
              description="The body to be used with the HTTP request."
              field="settings.http.body"
              rows={10}
            />
          </FormTabContent>

          <FormTabContent label="Authentication">
            {/* TODO: Use base settings field instead of two fields? */}
            <FormHttpAuthenticationField
              basicAuthField="settings.http.basicAuth"
              bearerTokenField="settings.http.bearerToken"
            />
          </FormTabContent>

          <FormTabContent label="TLS">
            {/* TODO: This is not super transparent */}
            <FormTLSConfigField field="settings.http" />
          </FormTabContent>

          <FormTabContent label="Proxy">
            <GenericInputField
              field="settings.http.proxyURL"
              label="Proxy URL"
              description="HTTP proxy server to use to connect to the target."
            />
            <GenericNameValueField
              label="Proxy connect headers"
              description="The HTTP headers sent to the proxy."
              allowEmpty
              field="settings.http.proxyConnectHeaders"
              addButtonText="Proxy connect header"
              interpolationVariables={{ type: 'Header' }}
            />
          </FormTabContent>
        </FormTabs>
      </AdditionalSettings>
    </SectionContent>
  );
}
