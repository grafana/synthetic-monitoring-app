import {
  ArrayVector,
  FieldColorModeId,
  FieldType,
  MutableDataFrame,
  NodeGraphDataFrameFieldNames,
} from '@grafana/data';
import { LogQueryResponse, LogsAggregatedByTrace, TracesByHost, ParsedLogStream } from './types';

const getNodeGraphFields = () => {
  const nodeIdField = {
    name: NodeGraphDataFrameFieldNames.id,
    type: FieldType.string,
    values: new ArrayVector(),
  };

  const nodeTitleField = {
    name: NodeGraphDataFrameFieldNames.title,
    type: FieldType.string,
    values: new ArrayVector(),
    config: { displayName: 'Host' },
  };

  // const typeField = {
  //   name: NodeGraphDataFrameFieldNames.subTitle,
  //   type: FieldType.string,
  //   values: new ArrayVector(),
  //   config: { displayName: 'Type' },
  // };

  const nodeMainStatField = {
    name: NodeGraphDataFrameFieldNames.mainStat,
    type: FieldType.number,
    values: new ArrayVector(),
    config: { unit: 'ms', displayName: 'Average Ms' },
  };

  const nodeStartField = {
    name: NodeGraphDataFrameFieldNames.arc + 'start',
    type: FieldType.number,
    values: new ArrayVector(),
    config: { color: { fixedColor: 'blue', mode: FieldColorModeId.Fixed }, displayName: 'Start nodes' },
  };

  const nodeSuccessField = {
    name: NodeGraphDataFrameFieldNames.arc + 'success',
    type: FieldType.number,
    values: new ArrayVector(),
    config: { color: { fixedColor: 'green', mode: FieldColorModeId.Fixed }, displayName: 'Successful packets' },
  };

  const nodeErrorField = {
    name: NodeGraphDataFrameFieldNames.arc + 'error',
    type: FieldType.number,
    values: new ArrayVector(),
    config: { color: { fixedColor: 'red', mode: FieldColorModeId.Fixed }, displayName: 'Packet loss' },
  };

  const nodeDestinationField = {
    name: NodeGraphDataFrameFieldNames.arc + 'destination',
    type: FieldType.number,
    values: new ArrayVector(),
    config: { color: { fixedColor: 'purple', mode: FieldColorModeId.Fixed }, displayName: 'Destination node' },
  };

  const nodeMostRecentDestinationField = {
    name: NodeGraphDataFrameFieldNames.arc + 'most_recent_destination',
    type: FieldType.number,
    values: new ArrayVector(),
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
    values: new ArrayVector(),
  };
  const edgeSourceField = {
    name: NodeGraphDataFrameFieldNames.source,
    type: FieldType.string,
    values: new ArrayVector(),
  };
  const edgeTargetField = {
    name: NodeGraphDataFrameFieldNames.target,
    type: FieldType.string,
    values: new ArrayVector(),
  };

  // These are needed for links to work
  // const edgeSourceNameField = {
  //   name: 'sourceName',
  //   type: FieldType.string,
  //   values: new ArrayVector(),
  // };
  // const edgeTargetNameField = {
  //   name: 'targetName',
  //   type: FieldType.string,
  //   values: new ArrayVector(),
  // };

  // const edgeMainStatField = {
  //   name: NodeGraphDataFrameFieldNames.mainStat,
  //   type: FieldType.string,
  //   values: new ArrayVector(),
  //   config: { displayName: 'Response percentage' },
  // };

  return {
    edgeIdField,
    edgeSourceField,
    edgeTargetField,
  };
};

export const parseTracerouteLogs = (queryResponse: LogQueryResponse): MutableDataFrame[] => {
  const { edgeIdField, edgeSourceField, edgeTargetField } = getNodeGraphEdgeFields();

  let mostRecentTraceId: string;

  const destinations = new Set<string>();
  const groupedByTraceID = queryResponse.data.reduce<LogsAggregatedByTrace>((acc, { stream, values }, index) => {
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
        stream.Hosts.forEach((host) => {
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

      nodeIdField.values.add(host);
      nodeTitleField.values.add(host);
      nodeMainStatField.values.add(Math.round(averageElapsedTime));

      Array.from(hostData.nextHosts ?? new Set([])).forEach((nextHost) => {
        edgeIdField.values.add(`${host}_${nextHost}`);
        edgeSourceField.values.add(host);
        edgeTargetField.values.add(nextHost);
      });

      if (hostData.isStart) {
        nodeMostRecentDestinationField.values.add(0);
        nodeDestinationField.values.add(0);
        nodeStartField.values.add(1);
        nodeSuccessField.values.add(0);
        nodeErrorField.values.add(0);
      } else if (destinations.has(host)) {
        if (hostData.isMostRecent) {
          nodeMostRecentDestinationField.values.add(1);
          nodeDestinationField.values.add(0);
        } else {
          nodeMostRecentDestinationField.values.add(0);
          nodeDestinationField.values.add(1);
        }
        nodeStartField.values.add(0);
        nodeSuccessField.values.add(0);
        nodeErrorField.values.add(0);
      } else {
        nodeDestinationField.values.add(0);
        nodeMostRecentDestinationField.values.add(0);
        nodeStartField.values.add(0);
        nodeSuccessField.values.add(packetSuccessStat);
        nodeErrorField.values.add(packetLossStat);
      }
    });

  return [
    new MutableDataFrame({
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
    new MutableDataFrame({
      name: 'edges',
      refId: 'edgesRefId',
      fields: [edgeIdField, edgeSourceField, edgeTargetField],
      meta: {
        preferredVisualisationType: 'nodeGraph',
      },
    }),
  ];
};
