export const SAGA_UUID = '01a090f2-4a8b-7c99-9c5c-aed52cb7ca8f';
export const SECOND_SAGA_UUID = '01a090f2-4a8b-7c99-9c5c-aed52cb7ca90';

/** Matches Saga internal/api/get.go. Filenames are intentionally not identifiers. */
export function sagaMetadata(uuid = SAGA_UUID) {
  return {
    uuid,
    execution_id: '01a090f0-1000-7000-8000-000000000001',
    created_at: '2026-09-15T10:00:00Z',
    content_type: 'image/png',
    size_bytes: 483221,
    url: `https://screenshots.s3.us-east-1.amazonaws.com/dev/123/execution/${uuid}.png?X-Amz-Signature=mock-signature`,
    url_expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
  };
}

/** Infinity table result, not the raw Saga HTTP body. */
export function sagaQueryResponse(metadata = sagaMetadata(), refId = metadata.uuid) {
  const fields = ['uuid', 'url', 'url_expires_at'] as const;
  return {
    results: {
      [refId]: {
        status: 200,
        frames: [
          {
            schema: { refId, fields: fields.map((name) => ({ name, type: 'string' })) },
            data: { values: fields.map((name) => [metadata[name]]) },
          },
        ],
      },
    },
  };
}
