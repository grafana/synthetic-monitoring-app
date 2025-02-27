import {
  createDataFrame,
  DataFrame,
  Field,
  FieldColorModeId,
  FieldType,
  NodeGraphDataFrameFieldNames,
} from '@grafana/data';

import { LogsAggregatedByTrace, LogStream, ParsedLogStream, TracesByHost } from './types';

const getNodeGraphFields = () => {
  const nodeIdField: Field = {
    name: NodeGraphDataFrameFieldNames.id,
    type: FieldType.string,
    values: [] as string[],
    config: { displayName: 'ID' },
  };

  const nodeTitleField: Field = {
    name: NodeGraphDataFrameFieldNames.title,
    type: FieldType.string,
    values: [] as string[],
    config: { displayName: 'Host' },
  };

  const nodeMainStatField: Field = {
    name: NodeGraphDataFrameFieldNames.mainStat,
    type: FieldType.number,
    values: [] as number[],
    config: { unit: 'ms', displayName: 'Average Ms' },
  };

  const nodeStartField: Field = {
    name: NodeGraphDataFrameFieldNames.arc + 'start',
    type: FieldType.number,
    values: [] as number[],
    config: { color: { fixedColor: 'blue', mode: FieldColorModeId.Fixed }, displayName: 'Start nodes' },
  };

  const nodeSuccessField: Field = {
    name: NodeGraphDataFrameFieldNames.arc + 'success',
    type: FieldType.number,
    values: [] as number[],
    config: { color: { fixedColor: 'green', mode: FieldColorModeId.Fixed }, displayName: 'Successful packets' },
  };

  const nodeErrorField: Field = {
    name: NodeGraphDataFrameFieldNames.arc + 'error',
    type: FieldType.number,
    values: [] as number[],
    config: { color: { fixedColor: 'red', mode: FieldColorModeId.Fixed }, displayName: 'Packet loss' },
  };

  const nodeDestinationField: Field = {
    name: NodeGraphDataFrameFieldNames.arc + 'destination',
    type: FieldType.number,
    values: [] as number[],
    config: { color: { fixedColor: 'purple', mode: FieldColorModeId.Fixed }, displayName: 'Destination node' },
  };

  const nodeMostRecentDestinationField: Field = {
    name: NodeGraphDataFrameFieldNames.arc + 'most_recent_destination',
    type: FieldType.number,
    values: [] as number[],
    config: {
      color: { fixedColor: 'yellow', mode: FieldColorModeId.Fixed },
      displayName: 'Most recent destination node',
    },
  };

  return {
    nodeIdField,
    nodeTitleField,
    nodeStartField,
    nodeMainStatField,
    nodeDestinationField,
    nodeMostRecentDestinationField,
    nodeSuccessField,
    nodeErrorField,
  };
};

const getNodeGraphEdgeFields = () => {
  const edgeIdField = {
    name: NodeGraphDataFrameFieldNames.id,
    type: FieldType.string,
    values: [] as string[],
  };
  const edgeSourceField = {
    name: NodeGraphDataFrameFieldNames.source,
    type: FieldType.string,
    values: [] as string[],
  };
  const edgeTargetField = {
    name: NodeGraphDataFrameFieldNames.target,
    type: FieldType.string,
    values: [] as string[],
  };

  return {
    edgeIdField,
    edgeSourceField,
    edgeTargetField,
  };
};

export const parseTracerouteLogs = (queryResponse: LogStream[]): DataFrame[] => {
  const { edgeIdField, edgeSourceField, edgeTargetField } = getNodeGraphEdgeFields();

  let mostRecentTraceId: string;

  const destinations = new Set<string>();
  const groupedByTraceID = queryResponse.reduce<LogsAggregatedByTrace>((acc, stream) => {
    const traceId = stream.TracerouteID;
    if (traceId && !mostRecentTraceId) {
      mostRecentTraceId = traceId;
    }
    if (!traceId) {
      return acc;
    }

    const hosts = stream.Hosts === '' ? [`??? TTL${stream.TTL + stream.probe}`] : stream.Hosts?.split(',');
    destinations.add(stream.Destination);
    const updatedStream = {
      ...stream,
      Hosts: hosts,
      TTL: parseInt(stream.TTL, 10),
    };

    if (acc[traceId]) {
      acc[traceId].push(updatedStream);
    } else {
      const probe = {
        ...updatedStream,
        LossPercent: '0',
        ElapsedTime: '0ms',
        Success: 'true',
        TTL: 0,
        Hosts: [stream.probe],
      };
      acc[traceId] = [probe, updatedStream];
    }
    return acc;
  }, {});

  type NextHost = {
    addresses: string[];
    TTL: number;
  };

  const findNextHosts = (currentTTL: number, streamArr: ParsedLogStream[]): NextHost | undefined => {
    const nextHostStreamIndex = streamArr.findIndex((stream) => stream.TTL > currentTTL && Boolean(stream.Hosts));
    if (nextHostStreamIndex > -1) {
      return { addresses: streamArr[nextHostStreamIndex]?.Hosts, TTL: streamArr[nextHostStreamIndex]?.TTL };
    }
    return;
  };

  const groupedByHost = Object.entries(groupedByTraceID).reduce<TracesByHost>((acc, [traceId, streamArray]) => {
    streamArray
      .sort((a, b) => a.TTL - b.TTL)
      .forEach((stream, index, arr) => {
        stream.Hosts?.forEach((host) => {
          const nextHosts = destinations.has(host) ? undefined : findNextHosts(stream.TTL, arr);
          const currentHost = acc[host];

          if (currentHost) {
            if (nextHosts) {
              nextHosts.addresses.forEach((nextHost) => {
                if (!currentHost.nextHosts?.has(nextHost)) {
                  currentHost.nextHosts?.add(nextHost);
                }
              });
            }
            currentHost.elapsedTimes.push(stream.ElapsedTime);
            currentHost.packetLossAverages.push(parseInt(stream.LossPercent, 10));
            if (traceId === mostRecentTraceId) {
              currentHost.isMostRecent = true;
            }
          } else {
            acc[host] = {
              nextHosts: nextHosts?.addresses ? new Set(nextHosts.addresses) : new Set(),
              elapsedTimes: [stream.ElapsedTime],
              isStart: stream.TTL === 0,
              isMostRecent: traceId === mostRecentTraceId,
              packetLossAverages: [parseInt(stream.LossPercent, 10)],
              TTL: stream.TTL,
            };
          }
        });
      });
    return acc;
  }, {});

  const {
    nodeIdField,
    nodeTitleField,
    nodeMainStatField,
    nodeDestinationField,
    nodeStartField,
    nodeMostRecentDestinationField,
    nodeSuccessField,
    nodeErrorField,
  } = getNodeGraphFields();

  Object.entries(groupedByHost)
    // .sort((a, b) => {
    //   a[1].TTL - b[1].TTL;
    // })
    .forEach(([host, hostData]) => {
      const totalElapsedTime = hostData.elapsedTimes.reduce((totalTime, elapsedTime) => {
        const cleanedString = elapsedTime?.replace('ms', '') ?? 0;
        const int = parseInt(cleanedString, 10);
        return totalTime + int;
      }, 0);
      const averageElapsedTime = totalElapsedTime / hostData.elapsedTimes.length;

      const totalPacketLoss = hostData.packetLossAverages.reduce((acc, packetLoss) => packetLoss + acc, 0);

      const packetLossStat = totalPacketLoss / hostData.packetLossAverages.length / 100;
      const packetSuccessStat = 1 - packetLossStat;

      nodeIdField.values.push(host);
      nodeTitleField.values.push(host);
      nodeMainStatField.values.push(Math.round(averageElapsedTime));

      Array.from(hostData.nextHosts ?? new Set([])).forEach((nextHost) => {
        edgeIdField.values.push(`${host}_${nextHost}`);
        edgeSourceField.values.push(host);
        edgeTargetField.values.push(nextHost);
      });

      if (hostData.isStart) {
        nodeMostRecentDestinationField.values.push(0);
        nodeDestinationField.values.push(0);
        nodeStartField.values.push(1);
        nodeSuccessField.values.push(0);
        nodeErrorField.values.push(0);
      } else if (destinations.has(host)) {
        if (hostData.isMostRecent) {
          nodeMostRecentDestinationField.values.push(1);
          nodeDestinationField.values.push(0);
        } else {
          nodeMostRecentDestinationField.values.push(0);
          nodeDestinationField.values.push(1);
        }
        nodeStartField.values.push(0);
        nodeSuccessField.values.push(0);
        nodeErrorField.values.push(0);
      } else {
        nodeDestinationField.values.push(0);
        nodeMostRecentDestinationField.values.push(0);
        nodeStartField.values.push(0);
        nodeSuccessField.values.push(packetSuccessStat);
        nodeErrorField.values.push(packetLossStat);
      }
    });

  return [
    createDataFrame({
      name: 'nodes',
      refId: 'nodeRefId',
      fields: [
        nodeIdField,
        nodeTitleField,
        nodeMainStatField,
        nodeDestinationField,
        nodeStartField,
        nodeMostRecentDestinationField,
        nodeSuccessField,
        nodeErrorField,
      ],
      meta: {
        preferredVisualisationType: 'nodeGraph',
      },
    }),
    createDataFrame({
      name: 'edges',
      refId: 'edgesRefId',
      fields: [edgeIdField, edgeSourceField, edgeTargetField],
      meta: {
        preferredVisualisationType: 'nodeGraph',
      },
    }),
  ];
};
