import { expect } from 'https://jslib.k6.io/k6-testing/0.5.0/index.js';
import { browser } from 'k6/browser';

export const options = {
  scenarios: {
    ui: {
      executor: 'shared-iterations',
      options: {
        browser: {
          type: 'chromium',
        },
      },
    },
  },
  thresholds: {
    checks: ['rate==1.0'],
  },
};

export default async function () {
  const page = await browser.newPage();
  const context = page.context();

  try {
    // get cookies from the browser context
    expect((await context.cookies()).length).toBe(0);

    // add some cookies to the browser context
    const unixTimeSinceEpoch = Math.round(new Date() / 1000);
    const day = 60 * 60 * 24;
    const dayAfter = unixTimeSinceEpoch + day;
    const dayBefore = unixTimeSinceEpoch - day;
    await context.addCookies([
      // this cookie expires at the end of the session
      {
        name: 'testcookie',
        value: '1',
        sameSite: 'Strict',
        domain: '127.0.0.1',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      // this cookie expires in a day
      {
        name: 'testcookie2',
        value: '2',
        sameSite: 'Lax',
        domain: '127.0.0.1',
        path: '/',
        expires: dayAfter,
      },
      // this cookie expires in the past, so it will be removed.
      {
        name: 'testcookie3',
        value: '3',
        sameSite: 'Lax',
        domain: '127.0.0.1',
        path: '/',
        expires: dayBefore,
      },
    ]);
    let cookies = await context.cookies();
    expect(cookies.length).toBe(2);
    expect(cookies[0].name).toBe('testcookie');
    expect(cookies[0].value).toBe('1');
    expect(cookies[0].expires).toBe(-1);
    expect(cookies[0].domain).toBe('127.0.0.1');
    expect(cookies[0].path).toBe('/');
    expect(cookies[0].httpOnly).toBe(true);
    expect(cookies[0].secure).toBe(true);
    expect(cookies[1].name).toBe('testcookie2');
    expect(cookies[1].value).toBe('2');

    // let's add more cookies to filter by urls.
    await context.addCookies([
      {
        name: 'foo',
        value: '42',
        sameSite: 'Strict',
        url: 'http://foo.com',
      },
      {
        name: 'bar',
        value: '43',
        sameSite: 'Lax',
        url: 'https://bar.com',
      },
      {
        name: 'baz',
        value: '44',
        sameSite: 'Lax',
        url: 'https://baz.com',
      },
    ]);
    cookies = await context.cookies('http://foo.com', 'https://baz.com');
    expect(cookies.length).toBe(2);
    expect(cookies[0].name).toBe('foo');
    expect(cookies[0].value).toBe('42');
    expect(cookies[1].name).toBe('baz');
    expect(cookies[1].value).toBe('44');

    // clear cookies
    await context.clearCookies();
    cookies = await context.cookies();
    expect(cookies.length).toBe(0);
  } finally {
    await page.close();
  }
}
