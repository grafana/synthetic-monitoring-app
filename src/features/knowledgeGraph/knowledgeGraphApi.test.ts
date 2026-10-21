import { KG_FRONTEND_APPS } from 'test/fixtures/knowledgeGraph';
import { apiRoute } from 'test/handlers';
import { server } from 'test/server';

import { fetchFrontendApps } from './knowledgeGraphApi';

it('continues discovery when lastPage is absent, until an empty page', async () => {
  const pages: number[] = [];
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: async (request) => {
        const { pageNum } = await request.json();
        pages.push(pageNum);
        return { json: { data: { entities: pageNum < 2 ? [KG_FRONTEND_APPS[pageNum]] : [] } } };
      },
    })
  );
  const apps = await fetchFrontendApps();
  expect(apps.map((app) => app.id)).toEqual(['229', '230']);
  expect(pages).toEqual([0, 1, 2]);
});

it('fails instead of presenting incomplete discovery when pagination never ends', async () => {
  let requests = 0;
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => {
        requests++;
        return { json: { data: { entities: KG_FRONTEND_APPS, lastPage: false } } };
      },
    })
  );
  await expect(fetchFrontendApps()).rejects.toThrow('pagination limit');
  expect(requests).toBe(100);
});

it('does not request another page after discovery is cancelled', async () => {
  const controller = new AbortController();
  let requests = 0;
  server.use(
    apiRoute('searchKnowledgeGraphEntities', {
      result: () => {
        requests++;
        controller.abort();
        return { json: { data: { entities: KG_FRONTEND_APPS, lastPage: false } } };
      },
    })
  );
  await expect(fetchFrontendApps(controller.signal)).rejects.toThrow();
  expect(requests).toBe(1);
});

it('does not start discovery for an already cancelled request', async () => {
  const controller = new AbortController();
  controller.abort();
  await expect(fetchFrontendApps(controller.signal)).rejects.toThrow();
});
