import React from 'react';
import { CHECKSTER_TEST_ID } from 'test/dataTestIds';

import { useGetIndexFieldError } from '../../../hooks/useGetIndexFieldError';
import { useHasFieldsError } from '../../../hooks/useHasFieldsError';
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

const REQUEST_OPTIONS_TAB_FIELDS = [
  [/\.headers/], // Options
  undefined, // Body
  [/\.basicAuth\./], // Authentication
  [/\.tlsConfig\./], // TSL
  [/\.proxyConnectHeaders\.\d+\./], // Proxy
];

const REQUEST_OPTIONS_FIELDS = REQUEST_OPTIONS_TAB_FIELDS.filter((field) => {
  return field !== undefined;
}).flat();

export const HTTP_CHECK_FIELDS = ['job', 'target', ...REQUEST_OPTIONS_FIELDS];

export function HttpCheckContent() {
  const hasRequestOptionError = useHasFieldsError(REQUEST_OPTIONS_FIELDS);
  const tabIndexErrors = useGetIndexFieldError(REQUEST_OPTIONS_TAB_FIELDS);

  return (
    <SectionContent>
      <FormJobField field="job" />

      <ChooseCheckType />

      {/* TODO: Would be nice to write root fields like `.target` (instead of `target`) */}
      <FormHttpRequestMethodTargetFields
        data-testid={CHECKSTER_TEST_ID.form.inputs.instance}
        method-data-testid={CHECKSTER_TEST_ID.form.inputs.httpRequestMethod}
        field="target"
        methodField="settings.http.method"
        withQueryParams
      />

      <AdditionalSettings indent buttonLabel="Request options" isOpen={hasRequestOptionError}>
        <FormTabs tabErrorIndexes={tabIndexErrors}>
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
