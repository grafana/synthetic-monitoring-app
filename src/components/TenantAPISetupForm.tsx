import React, { useState } from 'react';
import { Alert, Button, Container, Field, HorizontalGroup, InfoBox, Input } from '@grafana/ui';
import { useForm } from 'react-hook-form';
import { Collapse } from 'components/Collapse';
import { DEFAULT_API_HOST } from './constants';

interface FormValues {
  adminApiToken: string;
  apiHost?: string;
}

interface Props {
  onSubmit: (values: FormValues) => void;
  submissionError?: string;
}

const TenantAPISetupForm = ({ onSubmit, submissionError }: Props) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const {
    register,
    formState: { errors, isSubmitting },
    handleSubmit,
  } = useForm({
    mode: 'onChange',
    defaultValues: { apiHost: DEFAULT_API_HOST, adminApiToken: '' },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
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
              <a
                className="highlight-word"
                href="//grafana.com/profile/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                Generate a new API key
              </a>
            </p>
          </InfoBox>
          <Field label="Admin API Key" required invalid={Boolean(errors.adminApiToken)}>
            <Input
              {...register('adminApiToken', { required: true })}
              id="tenant-setup-api-key"
              type="text"
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
                {...register('apiHost', {
                  validate: (value) => {
                    try {
                      new URL(value);
                    } catch ({ message }) {
                      return message;
                    }
                  },
                })}
                id="tenant-setup-backend-host"
                type="text"
                width={40}
                placeholder="Synthetic Monitoring Backend Address"
              />
            </Field>
          </HorizontalGroup>
        </Collapse>
        <Button type="submit" disabled={isSubmitting || Object.keys(errors).length > 0}>
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
    </form>
  );
};

export default TenantAPISetupForm;
