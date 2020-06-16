import React, { PureComponent } from 'react';
import {
  Badge,
  BadgeColor,
  Modal,
  Button,
  Container,
  ConfirmModal,
  Field,
  Input,
  HorizontalGroup,
  Switch,
  Legend,
  IconName,
} from '@grafana/ui';
import { Label as WorldpingLabel, Probe, OrgRole } from 'types';
import { WorldPingDataSource } from 'datasource/DataSource';
import { hasRole } from 'utils';
import { FormLabel, WorldpingLabelsForm } from './utils';
import { UptimeGauge } from './UptimeGauge';

interface Props {
  probe: Probe;
  instance: WorldPingDataSource;
  onReturn: (reload: boolean) => void;
}

interface State {
  probe?: Probe;
  showDeleteModal: boolean;
  showTokenModal: boolean;
  probeToken: string;
  showResetModal: boolean;
}

export class ProbeEditor extends PureComponent<Props, State> {
  state: State = {
    showDeleteModal: false,
    showTokenModal: false,
    showResetModal: false,
    probeToken: '',
  };

  async componentDidMount() {
    const probe = { ...this.props.probe } as Probe;
    this.setState({
      probe: probe,
    });
  }

  showDeleteProbeModal = (show: boolean) => () => {
    this.setState({ showDeleteModal: show });
  };

  showTokenModal = (show: boolean) => () => {
    this.setState({ showTokenModal: show });
  };

  showResetModal = (show: boolean) => () => {
    this.setState({ showResetModal: show });
  };

  onRemoveProbe = async () => {
    const id = this.props.probe.id || 0;
    if (!this.props.probe.id) {
      return;
    }
    const info = this.props.instance.deleteProbe(id);
    console.log('Remove Probe', id, info);
    this.props.onReturn(true);
  };

  onLabelsUpdate = (labels: WorldpingLabel[]) => {
    let probe = { ...this.state.probe } as Probe;
    probe.labels = labels;
    this.setState({ probe });
  };

  onLatUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let probe = { ...this.state.probe } as Probe;
    probe.latitude = event.target.valueAsNumber;
    this.setState({ probe });
  };

  onLongUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let probe = { ...this.state.probe } as Probe;
    probe.longitude = event.target.valueAsNumber;
    this.setState({ probe });
  };

  onNameUpdate = (event: React.ChangeEvent<HTMLInputElement>) => {
    let probe = { ...this.state.probe } as Probe;
    probe.name = event.target.value;
    this.setState({ probe });
  };

  onSave = async () => {
    const { instance } = this.props;
    const { probe } = this.state;
    if (!probe) {
      return;
    }
    if (probe.id) {
      console.log('UPDATE', probe, instance);
      const info = await instance.updateProbe(probe);
      console.log('got', info);
      this.props.onReturn(true);
    } else {
      console.log('ADD', probe);
      const info = await instance.addProbe(probe);
      this.setState({ showTokenModal: true, probeToken: info.token });
    }
  };

  onResetToken = async () => {
    const { instance } = this.props;
    const probe = { ...this.props.probe };
    const info = await instance.resetProbeToken(probe);
    this.setState({ showTokenModal: true, showResetModal: false, probeToken: info.token });
  };

  onBack = () => {
    this.props.onReturn(false);
  };

  isValid(): boolean {
    const { probe } = this.state;
    if (!probe) {
      return false;
    }
    if (probe.name === '') {
      console.log('probe name must be set');
      return false;
    }
    if (probe.name.length > 32) {
      console.log('probe name must be less than 32 characters');
      return false;
    }
    if (probe.latitude < -90 || probe.latitude > 90) {
      console.log('probe latitude must be between -90 and 90');
      return false;
    }
    if (probe.longitude < -180 || probe.longitude > 180) {
      console.log('probe longitude must be between -180 and 180');
      return false;
    }
    for (const l of probe.labels) {
      if (l.name === '' || l.value === '') {
        console.log('label name and value must be set');
        return false;
      }
      if (!l.name.match(/^[a-zA-Z0-9_]*$/)) {
        console.log('label name can only contain a-zA-Z0-9_');
        return false;
      }
      if (l.name.length > 32) {
        console.log('label name must be less than 32 chars');
        return false;
      }
      if (l.value.length > 64) {
        console.log('label name must be less than 64 chars');
        return false;
      }
    }
    return true;
  }

  renderStatus() {
    const { probe, showResetModal } = this.state;
    const { instance } = this.props;

    if (!probe) {
      return;
    }
    let isEditor = !probe.public && hasRole(OrgRole.EDITOR);
    let onlineTxt = 'Offline';
    let onlineIcon = 'heart-break' as IconName;
    let color = 'red' as BadgeColor;
    if (probe.online) {
      onlineTxt = 'Online';
      onlineIcon = 'heart';
      color = 'green';
    }

    return (
      <Container margin="md">
        <Legend>
          Status: &nbsp;
          <Badge color={color} icon={onlineIcon} text={onlineTxt} />
        </Legend>
        {!probe.public && (
          <Container>
            <Button variant="destructive" onClick={this.showResetModal(true)} disabled={!isEditor}>
              Reset Access Token
            </Button>
            <ConfirmModal
              isOpen={showResetModal}
              title="Reset Probe Access Token"
              body="Are you sure you want to reset the access token for this Probe?"
              confirmText="Reset Token"
              onConfirm={this.onResetToken}
              onDismiss={this.showResetModal(false)}
            />
          </Container>
        )}
        <br />
        <UptimeGauge
          labelNames={['probe']}
          labelValues={[probe.name]}
          ds={instance.getMetricsDS()}
          height={200}
          width={300}
          sparkline={true}
        />
      </Container>
    );
  }

  render() {
    const { probe, showDeleteModal, showTokenModal, probeToken } = this.state;
    if (!probe) {
      return <div>Loading...</div>;
    }
    let legend = 'Configuration';
    if (!probe.id) {
      legend = 'Add Probe';
    }
    let isEditor = !probe.public && hasRole(OrgRole.EDITOR);

    return (
      <HorizontalGroup align="flex-start">
        <Container>
          <Legend>{legend}</Legend>
          <Container margin="md">
            <HorizontalGroup>
              <Field label={<FormLabel name="Probe Name" help="Unique name of probe" />} disabled={!isEditor}>
                <Input type="string" value={probe.name} onChange={this.onNameUpdate} />
              </Field>
              <Field
                label={
                  <FormLabel name="Public" help="Public probes are run by Grafana Labs and can be used by all users" />
                }
                disabled={!isEditor}
              >
                <Container padding="sm">
                  <Switch value={probe.public} disabled={false} />
                </Container>
              </Field>
            </HorizontalGroup>
          </Container>
          <Container margin="md">
            <h3 className="page-heading">Location information</h3>
            <HorizontalGroup>
              <Field
                label={<FormLabel name="Latitude" help="Latitude coordinates of this probe" />}
                disabled={!isEditor}
              >
                <Input
                  label="Latitude"
                  type="number"
                  placeholder="0.0"
                  value={probe?.latitude || 0.0}
                  onChange={this.onLatUpdate}
                />
              </Field>
              <Field
                label={<FormLabel name="Longitude" help="Longitude coordinates of this probe" />}
                disabled={!isEditor}
              >
                <Input
                  label="Longitude"
                  type="number"
                  placeholder="0.0"
                  value={probe?.longitude || 0.0}
                  onChange={this.onLongUpdate}
                />
              </Field>
            </HorizontalGroup>
          </Container>
          <Container margin="md">
            <h3 className="page-heading">Labels</h3>
            <WorldpingLabelsForm
              labels={probe.labels}
              onUpdate={this.onLabelsUpdate}
              isEditor={isEditor}
              type="Label"
            />
          </Container>
          <Container margin="md">
            <HorizontalGroup>
              <Button onClick={this.onSave} disabled={!isEditor || !this.isValid()}>
                Save
              </Button>
              {probe.id && (
                <Button variant="destructive" onClick={this.showDeleteProbeModal(true)} disabled={!isEditor}>
                  Delete Probe
                </Button>
              )}
              <ConfirmModal
                isOpen={showDeleteModal}
                title="Delete Probe"
                body="Are you sure you want to delete this Probe?"
                confirmText="Delete Probe"
                onConfirm={this.onRemoveProbe}
                onDismiss={this.showDeleteProbeModal(false)}
              />
              <a onClick={this.onBack}>Back</a>
            </HorizontalGroup>
          </Container>
          <Modal
            isOpen={showTokenModal}
            title="Probe Authentication Token"
            icon={'lock'}
            onDismiss={probe.id ? this.showTokenModal(false) : this.onBack}
          >
            {probeToken}
          </Modal>
        </Container>
        {probe.id && this.renderStatus()}
      </HorizontalGroup>
    );
  }
}
