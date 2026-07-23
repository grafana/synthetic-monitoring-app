import { DataFrame, FieldType } from '@grafana/data';

import { CheckType } from 'types';

import {
  applyGraphPresentation,
  buildServiceNeighbourhoodQuery,
  escapeCypher,
  getCheckNodeIcon,
  getServiceEntityUrl,
} from './ConnectedServices.utils';

describe('escapeCypher', () => {
  it('escapes double quotes and backslashes so interpolated values cannot break out of the string', () => {
    expect(escapeCypher('grafana"; MATCH (n) DETACH DELETE n //')).toBe('grafana\\"; MATCH (n) DETACH DELETE n //');
    expect(escapeCypher('path\\to\\thing')).toBe('path\\\\to\\\\thing');
  });

  it('leaves plain values untouched', () => {
    expect(escapeCypher('vika http check.__http://grafana.com')).toBe('vika http check.__http://grafana.com');
  });
});

describe('buildServiceNeighbourhoodQuery', () => {
  it('matches the monitored service and walks CALLS in both directions', () => {
    const query = buildServiceNeighbourhoodQuery('vika http check.__http://grafana.com');

    expect(query).toContain(
      'MATCH (sy:SyntheticCheck {name: "vika http check.__http://grafana.com"})<-[:MONITORED_BY]-(s1:Service)'
    );
    // outbound dependencies
    expect(query).toContain('OPTIONAL MATCH (s1)-[:CALLS]->(downstream:Service)');
    // inbound callers
    expect(query).toContain('OPTIONAL MATCH (upstream:Service)-[:CALLS]->(s1)');
    expect(query).toContain('RETURN sy, s1, downstream, upstream');
  });

  it('escapes the entity name it interpolates', () => {
    const query = buildServiceNeighbourhoodQuery('evil"} DETACH DELETE n //');

    expect(query).toContain('{name: "evil\\"} DETACH DELETE n //"}');
  });
});

describe('getServiceEntityUrl', () => {
  it('builds a deep link to the Service entity page in the Knowledge Graph app', () => {
    expect(getServiceEntityUrl('frontend')).toBe('/a/grafana-asserts-app/catalog/Service/frontend');
  });

  it('scopes the link by namespace when provided and encodes both parts', () => {
    expect(getServiceEntityUrl('front end', 'otel demo')).toBe(
      '/a/grafana-asserts-app/catalog/Service/front%20end?namespace=otel%20demo'
    );
  });
});

describe('getCheckNodeIcon', () => {
  it("reuses the app's check-type-group icons (API Endpoint, Multi Step, Scripted, Browser)", () => {
    expect(getCheckNodeIcon(CheckType.Http)).toBe('heart-rate');
    expect(getCheckNodeIcon(CheckType.Dns)).toBe('heart-rate');
    expect(getCheckNodeIcon(CheckType.MultiHttp)).toBe('gf-interpolation-step-after');
    expect(getCheckNodeIcon(CheckType.Scripted)).toBe('k6');
    expect(getCheckNodeIcon(CheckType.Browser)).toBe('globe');
  });
});

describe('applyGraphPresentation', () => {
  function buildNodesFrame(rows: Array<{ subtitle: string; icon: string }>): DataFrame {
    return {
      name: 'nodes',
      length: rows.length,
      fields: [
        { name: 'subtitle', type: FieldType.string, config: {}, values: rows.map((r) => r.subtitle) },
        { name: 'icon', type: FieldType.string, config: {}, values: rows.map((r) => r.icon) },
        { name: 'noderadius', type: FieldType.number, config: {}, values: rows.map(() => 35) },
        { name: 'mainstat', type: FieldType.number, config: {}, values: rows.map(() => 0) },
      ],
    } as unknown as DataFrame;
  }

  it('sets the icon for the SyntheticCheck node only, leaves radius alone, and drops mainstat', () => {
    const [frame] = applyGraphPresentation(
      [
        buildNodesFrame([
          { subtitle: 'SyntheticCheck', icon: 'question-circle' },
          { subtitle: 'Service', icon: 'cog' },
        ]),
      ],
      'globe'
    );

    const iconField = frame.fields.find((f) => f.name === 'icon');
    const radiusField = frame.fields.find((f) => f.name === 'noderadius');

    expect(iconField?.values).toEqual(['globe', 'cog']);
    // Node sizing is left untouched — emphasis is via the icon only.
    expect(radiusField?.values).toEqual([35, 35]);
    expect(frame.fields.find((f) => f.name === 'mainstat')).toBeUndefined();
  });

  it('drops the mainstat label from the edges frame', () => {
    const edges = {
      name: 'edges',
      length: 1,
      fields: [
        { name: 'id', type: FieldType.string, config: {}, values: ['e0'] },
        { name: 'mainstat', type: FieldType.number, config: {}, values: [0] },
      ],
    } as unknown as DataFrame;

    const [result] = applyGraphPresentation([edges], 'globe');

    expect(result.fields.map((f) => f.name)).toEqual(['id']);
  });

  it('leaves frames that are neither nodes nor edges untouched', () => {
    const other = {
      name: 'other',
      length: 1,
      fields: [{ name: 'id', type: FieldType.string, config: {}, values: ['x'] }],
    } as unknown as DataFrame;
    const [result] = applyGraphPresentation([other], 'globe');

    expect(result).toBe(other);
  });
});
