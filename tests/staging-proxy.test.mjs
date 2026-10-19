import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Load the actual proxy source with lightweight framework/auth stubs so these
// unit tests cannot contact Supabase or depend on a running Next.js server.
async function loadProxy(staging) {
  const source = (await readFile(new URL('../proxy.js', import.meta.url), 'utf8'))
    .replace(/^import .*;\r?\n/gm, '');
  const stubs = `
    const isStaging = ${staging};
    export const observed = {authClients: 0, authUsers: 0, cookieWrites: []};
    const NextResponse = {
      json: (body, options) => Response.json(body, options),
      next: () => {
        const response = new Response(null, {status: 200});
        response.cookies = {set: (...args) => observed.cookieWrites.push(args)};
        return response;
      },
    };
    const authConfig = () => ({url: 'https://unit-test.invalid', key: 'test-only'});
    const createServerClient = (_url, _key, options) => {
      observed.authClients++;
      return {auth: {getUser: async () => {
        observed.authUsers++;
        options.cookies.getAll();
        options.cookies.setAll([{name: 'unit-test-cookie', value: 'test-only', options: {httpOnly: true}}]);
        return {data: {user: null}};
      }}};
    };
  `;
  return import('data:text/javascript;base64,' + Buffer.from(stubs + source).toString('base64'));
}

function request(pathname, method = 'GET') {
  return {method, nextUrl: {pathname}, cookies: {getAll: () => [], set: () => {}}};
}

test('staging proxy blocks management, OAuth, publishing and GET-based push paths', async () => {
  const {proxy, observed} = await loadProxy(true);
  const paths = ['/manage', '/manage/login', '/media-admin', '/editor/live', '/onboarding', '/api/manage', '/api/oauth/yahoo/start', '/api/oauth/yahoo/callback', '/api/push-release', '/api/send-hollis-push', '/api/media'];
  for (const pathname of paths) {
    const response = await proxy(request(pathname));
    assert.equal(response.status, 403, pathname);
    assert.equal(response.headers.get('cache-control'), 'no-store', pathname);
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow', pathname);
    assert.match((await response.json()).error, /disabled in staging/);
  }
  assert.equal(observed.authClients, 0, 'staging never initializes production auth');
});

test('staging proxy blocks all non-read request methods even on otherwise public paths', async () => {
  const {proxy} = await loadProxy(true);
  for (const method of ['POST', 'PUT', 'PATCH', 'DELETE', 'TRACE', 'CONNECT']) {
    for (const pathname of ['/', '/api/article-reactions', '/api/reel-diagnostics']) {
      const response = await proxy(request(pathname, method));
      assert.equal(response.status, 403, method + ' ' + pathname);
    }
  }
});

test('staging proxy permits public reads with noindex and restrictive connection policy', async () => {
  const {proxy} = await loadProxy(true);
  for (const pathname of ['/', '/doge', '/sunday-crew', '/api/live-scores', '/api/live-details', '/api/staging-disabled']) {
    for (const method of ['GET', 'HEAD', 'OPTIONS']) {
      const response = await proxy(request(pathname, method));
      assert.equal(response.status, 200, method + ' ' + pathname);
      assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
      const csp = response.headers.get('content-security-policy');
      assert.match(csp, /connect-src 'self'/);
      assert.doesNotMatch(csp, /supabase\.co/);
      assert.match(csp, /form-action 'self'/);
      assert.match(csp, /object-src 'none'/);
    }
  }
});

test('production proxy preserves management auth, refreshed cookies and private headers', async () => {
  const {proxy, observed} = await loadProxy(false);
  for (const pathname of ['/manage', '/manage/login', '/api/manage']) {
    const response = await proxy(request(pathname));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'private, no-store');
    assert.equal(response.headers.get('referrer-policy'), 'no-referrer');
    assert.equal(response.headers.get('x-robots-tag'), 'noindex, nofollow');
    assert.equal(response.headers.get('content-security-policy'), null);
  }
  assert.equal(observed.authClients, 3);
  assert.equal(observed.authUsers, 3);
  assert.equal(observed.cookieWrites.length, 3);
});

test('production public requests do not acquire staging restrictions or initialize auth', async () => {
  const {proxy, observed} = await loadProxy(false);
  const priorClients = observed.authClients;
  for (const [pathname, method] of [['/', 'GET'], ['/doge', 'GET'], ['/api/article-reactions', 'POST']]) {
    const response = await proxy(request(pathname, method));
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('x-robots-tag'), null);
    assert.equal(response.headers.get('content-security-policy'), null);
  }
  assert.equal(observed.authClients, priorClients);
});
