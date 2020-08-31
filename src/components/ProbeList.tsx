import React, { FC, useContext } from 'react';
import { css } from 'emotion';
import { Badge, Button, HorizontalGroup } from '@grafana/ui';
import { InstanceContext } from 'components/InstanceContext';
import { UptimeGauge } from 'components/UptimeGauge';
import { OrgRole, Probe, Label } from 'types';
import { hasRole } from 'utils';

interface Props {
  probes: Probe[];
  onAddNew: () => void;
  onSelectProbe: (probeId: number) => void;
}

const labelsToString = (labels: Label[]) => labels.map(({ name, value }) => `${name}=${value}`);

export const ProbeList: FC<Props> = ({ probes, onAddNew, onSelectProbe }) => {
  const { instance, loading: instanceLoading } = useContext(InstanceContext);

  if (instanceLoading || !instance) {
    return <div>Loading...</div>;
  }

  if (!probes) {
    return null;
  }

  return (
    <div>
      {hasRole(OrgRole.EDITOR) && (
        <HorizontalGroup justify="flex-end">
          <Button
            onClick={onAddNew}
            className={css`
              margin-bottom: 1rem;
            `}
          >
            New
          </Button>
        </HorizontalGroup>
      )}
      {probes
        .sort((probeA, probeB) => probeA.name.localeCompare(probeB.name))
        .filter(probe => Boolean(probe.id))
        .map(probe => {
          const onlineTxt = probe.online ? 'Online' : 'Offline';
          const onlineIcon = probe.online ? 'heart' : 'heart-break';
          const color = probe.online ? 'green' : 'red';
          return (
            <div key={probe.id} className="add-data-source-item" onClick={() => onSelectProbe(probe.id!)}>
              <div className="add-data-source-item-text-wrapper">
                <span className="add-data-source-item-text">{probe.name}</span>
                <span className="add-data-source-item-desc">
                  <Badge color={color} icon={onlineIcon} text={onlineTxt} />
                  <div>{labelsToString(probe.labels)}</div>
                </span>
              </div>
              <UptimeGauge
                labelNames={['probe']}
                labelValues={[probe.name]}
                ds={instance.api.getMetricsDS()}
                height={60}
                width={150}
                sparkline={false}
              />
              <div className="add-data-source-item-actions">
                <Button>Select</Button>
              </div>
            </div>
          );
        })}
      <br />
    </div>
  );
};
