import React, { FC, useState } from 'react';
import { Alert, Button, Collapse, Container, Field, Form, HorizontalGroup, InfoBox, Input } from '@grafana/ui';
import { DEFAULT_API_HOST } from './constants';

interface FormValues {
  adminApiToken: string;
  apiHost: string;
}

interface Props {
  onSubmit: (values: FormValues) => void;
  submissionError?: string;
}

const TenantAPISetupForm: FC<Props> = ({ onSubmit, submissionError }) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  return (
    <Form onSubmit={onSubmit} defaultValues={{ apiHost: DEFAULT_API_HOST }} validateOn="onChange">
      {({ register, errors, formState, getValues }) => (
        <div>
          <HorizontalGroup wrap={true}>
            <InfoBox
              title="Initialize Synthetic Monitoring App"
              url={'https://grafana.com/grafana/plugins/grafana-synthetic-monitoring-app/'}
            >
              <p>
                To initialize the App and connect it to your Grafana Cloud service you will need a Admin API key for you
                Grafana.com account. The <b>API key</b> is only needed for the initialization process and will not be
                stored. Once the initialization is complete you can safely delete the key.
                <br />
                <br />
                <a className="highlight-word" href="//grafana.com/profile/api-keys" target="_blank">
                  Generate a new API key
                </a>
              </p>
            </InfoBox>
            <Field label="Admin API Key" required invalid={Boolean(errors.adminApiToken)}>
              <Input
                ref={register({ required: true })}
                id="tenant-setup-api-key"
                type="text"
                name="adminApiToken"
                width={100}
                placeholder="Grafana.com Admin Api Key"
              />
            </Field>
          </HorizontalGroup>
          <br />
          <Collapse
            label="Advanced"
            collapsible={true}
            onToggle={() => setShowAdvanced(!showAdvanced)}
            isOpen={showAdvanced}
          >
            <HorizontalGroup>
              <Field label="Backend Address" invalid={Boolean(errors.apiHost)} error={errors.apiHost?.message}>
                <Input
                  ref={register({
                    required: true,
                    validate: value => {
                      try {
                        new URL(value);
                      } catch (e) {
                        return e.message;
                      }
                    },
                  })}
                  name="apiHost"
                  id="tenant-setup-backend-host"
                  type="text"
                  width={40}
                  placeholder="Synthetic Monitoring Backend Address"
                />
              </Field>
            </HorizontalGroup>
          </Collapse>
          <Button variant="primary" type="submit" disabled={!formState.isValid}>
            Initialize
          </Button>
          {submissionError && (
            <Container margin="md">
              <Alert title="Error" severity="error">
                {submissionError}
              </Alert>
            </Container>
          )}
        </div>
      )}
    </Form>
  );
};

export default TenantAPISetupForm;
