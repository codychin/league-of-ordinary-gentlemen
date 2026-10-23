import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {builtinModules} from 'node:module';

const read = p => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const promotion = read('.github/workflows/promote-verified-production.yml');
const routes = read('.github/workflows/production-route-verification.yml');
const scripts = ['promote-verified-release.mjs', 'check-public-routes.mjs'];

test('promotion sparse checkout stays bound to the validated SHA and existing safety gates', () => {
  assert.match(promotion, /ref: \$\{\{ github.event.workflow_run.head_sha \}\}/);
  assert.match(promotion, /fetch-depth: 1/);
  assert.match(promotion, /persist-credentials: false/);
  assert.match(promotion, /sparse-checkout-cone-mode: false/);
  for (const script of scripts) assert.ok(promotion.includes('/scripts/operations/' + script));
  assert.match(promotion, /head_branch == 'main'.*event == 'push'/);
  assert.match(promotion, /conclusion == 'success'/);
  assert.match(promotion, /test "\$HEAD" = "\$RELEASE_SHA"/);
  assert.match(promotion, /cancel-in-progress: false/);
  assert.doesNotMatch(promotion, /continue-on-error|filter:/);
});

test('route smoke checkout uses the event SHA and only its standalone script', () => {
  assert.match(routes, /ref: \$\{\{ github.event.deployment.sha \|\| github.sha \}\}/);
  assert.match(routes, /sparse-checkout-cone-mode: false/);
  assert.match(routes, /fetch-depth: 1/);
  assert.match(routes, /persist-credentials: false/);
  const paths = routes.match(/sparse-checkout: \|\n((?:            .*\n)+)/)?.[1].trim().split('\n');
  assert.deepEqual(paths, ['/scripts/operations/check-public-routes.mjs']);
});

test('sparse release scripts have no local module or filesystem dependencies', () => {
  for (const script of scripts) {
    const source = read('scripts/operations/' + script);
    assert.doesNotMatch(source, /\bimport\s*\(|\brequire\s*\(|\breadFile|\breaddir/);
    for (const [, name] of source.matchAll(/\bfrom\s+['"]([^'"]+)['"]/g)) {
      assert.ok(name.startsWith('node:') && builtinModules.includes(name.slice(5)), name);
    }
    assert.doesNotMatch(source, /\bimport\s*['"]/);
  }
});

test('missing credentials fail before checkout without printing the value', () => {
  const marker = '      - name: Require promotion credentials before checkout\n';
  assert.ok(promotion.indexOf(marker) < promotion.indexOf('      - name: Check out exact validated commit'));
  const command = promotion.split(marker)[1].split('      - name:')[0].split('        run: |\n')[1];
  for (const value of ['', 'test-only-secret']) {
    const result = spawnSync('bash', ['-e', '-c', command], {encoding: 'utf8', env: {...process.env, VERCEL_TOKEN: value}});
    assert.equal(result.status, value ? 0 : 1);
    assert.ok(!(result.stdout + result.stderr).includes('test-only-secret'));
  }
});

// Every fetch is replaced before the real, unchanged release script runs. There
// is no Vercel credential or network access, including on successful promotion.
const sha = 'a'.repeat(40);
function simulate(mode, extra = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'brief-promotion-'));
  try {
    const preload = join(dir, 'mock.mjs');
    const log = join(dir, 'calls.jsonl');
    writeFileSync(preload, `
      import {appendFileSync} from 'node:fs';
      const mode = ${JSON.stringify(mode)};
      globalThis.setTimeout = callback => { queueMicrotask(callback); return 0; };
      globalThis.fetch = async (url, options = {}) => {
        const u = new URL(url);
        if (u.origin !== 'https://api.vercel.com') throw Error('Unexpected network origin');
        appendFileSync(${JSON.stringify(log)}, JSON.stringify({path:u.pathname, method:options.method || 'GET'}) + '\\n');
        if (mode === 'http-error') return new Response('{}', {status:403});
        const good = {id:'dpl_test', state:'READY', meta:{githubCommitSha:'${sha}', githubCommitRef:'main'}};
        if (u.pathname === '/v6/deployments') {
          if (mode === 'wrong-sha') good.meta.githubCommitSha = 'b'.repeat(40);
          if (mode === 'wrong-branch') good.meta.githubCommitRef = 'staging';
          if (mode === 'failed-build') good.state = 'ERROR';
          if (mode === 'canceled-build') good.state = 'CANCELED';
          if (mode === 'not-ready') good.state = 'BUILDING';
          return Response.json({deployments:[good]});
        }
        if (u.pathname.endsWith('/promote/dpl_test') && options.method === 'POST') return Response.json({});
        if (u.pathname === '/v13/deployments/www.ordinarybrief.com') return Response.json({id:mode === 'wrong-domain-id'?'other':'dpl_test', readyState:'READY', meta:{githubCommitSha:mode === 'wrong-domain-sha'?'b'.repeat(40):'${sha}'}});
        throw Error('Unexpected request: ' + u.pathname);
      };
    `);
    const entry = process.env.BRIEF_TEST_SPARSE_ROOT
      ? join(process.env.BRIEF_TEST_SPARSE_ROOT, 'scripts/operations/promote-verified-release.mjs')
      : new URL('../scripts/operations/promote-verified-release.mjs', import.meta.url).pathname;
    const result = spawnSync(process.execPath, ['--import', preload, entry], {
      encoding:'utf8', timeout:10_000,
      env:{...process.env, VERCEL_TOKEN:'test-only-token', RELEASE_SHA:sha, VERCEL_PROJECT_ID:'test-project', ...extra},
    });
    let calls = [];
    try { calls = readFileSync(log,'utf8').trim().split('\n').map(JSON.parse); } catch (e) { if (e.code !== 'ENOENT') throw e; }
    assert.equal(result.error, undefined, result.error?.message);
    return {...result, calls};
  } finally { rmSync(dir, {recursive:true, force:true}); }
}

test('mocked exact-SHA READY promotion requires matching live deployment and SHA', () => {
  const r = simulate('success');
  assert.equal(r.status, 0, r.stderr);
  assert.match(r.stdout, /VERIFIED production domain/);
  assert.equal(r.calls.filter(x => x.method === 'POST').length, 1);
  assert.equal(r.calls.at(-1).path, '/v13/deployments/www.ordinarybrief.com');
});
for (const mode of ['wrong-sha', 'wrong-branch', 'failed-build', 'canceled-build', 'not-ready', 'http-error']) {
  test('promotion rejects ' + mode + ' without any promotion request', () => {
    const r = simulate(mode);
    assert.notEqual(r.status, 0);
    assert.equal(r.calls.filter(x => x.method === 'POST').length, 0);
    assert.doesNotMatch(r.stdout, /VERIFIED production domain/);
  });
}
for (const mode of ['wrong-domain-id', 'wrong-domain-sha']) {
  test('promotion refuses verification for ' + mode, () => {
    const r = simulate(mode);
    assert.notEqual(r.status, 0);
    assert.doesNotMatch(r.stdout, /VERIFIED production domain/);
  });
}
for (const extra of [{VERCEL_TOKEN:''}, {RELEASE_SHA:'main'}]) {
  test('promotion rejects invalid inputs before API access: ' + Object.keys(extra)[0], () => {
    const r = simulate('success', extra);
    assert.notEqual(r.status, 0);
    assert.equal(r.calls.length, 0);
  });
}
