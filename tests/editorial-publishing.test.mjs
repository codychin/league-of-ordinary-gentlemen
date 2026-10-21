import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import {
  FILES,
  hash,
  inspectPlacement,
  prepareChange,
  applyPrepared,
  validateRepository,
  preconditions,
} from '../scripts/editorial/publishing.mjs';
const repo = fileURLToPath(new URL('../', import.meta.url));
const fixture = JSON.parse(
  fs.readFileSync(
    new URL('./fixtures/editorial/staged-marnie.json', import.meta.url),
    'utf8',
  ),
);
const marnieFront = fs.readFileSync(
  new URL('./fixtures/editorial/staged-marnie-front.jsx', import.meta.url),
  'utf8',
);
function sandbox(t, { marnie = true } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brief-editorial-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  for (const file of [
    ...Object.values(FILES),
    'lib/editorial-scope.js',
    'app/archive/page.js',
    'app/components/editions/Archive.js',
    'app/page.js',
    'app/components/editions/Home.js',
  ]) {
    fs.mkdirSync(path.dirname(path.join(root, file)), { recursive: true });
    fs.copyFileSync(path.join(repo, file), path.join(root, file));
  }
  fs.cpSync(path.join(repo, 'app/articles'), path.join(root, 'app/articles'), {
    recursive: true,
  });
  if (marnie) {
    const file = path.join(root, 'app/articles/data.js');
    let s = fs.readFileSync(file, 'utf8');
    const { slug, ...meta } = fixture.article;
    s = s.replace(
      'export const articles = {',
      'export const articles = {\n' +
        JSON.stringify(slug) +
        ':' +
        JSON.stringify(meta) +
        ',',
    );
    fs.writeFileSync(file, s);
    const scope = path.join(root, 'lib/editorial-scope.js');
    fs.writeFileSync(
      scope,
      fs
        .readFileSync(scope, 'utf8')
        .replace('new Set([', 'new Set([\n' + JSON.stringify(slug) + ','),
    );
  }
  const r = validateRepository(root);
  const change = structuredClone(fixture.change);
  change.expected = preconditions(r);
  return { root, r, change };
}
const snapshot = (root) =>
  Object.fromEntries(
    Object.values(FILES).map((file) => [
      file,
      fs.readFileSync(path.join(root, file), 'utf8'),
    ]),
  );
const plan = (x) => prepareChange(x.root, x.change, marnieFront);
const story = (slug, r) => ({ slug, title: r.catalog[slug].title });
function replaceLead(source, s) {
  return source.replace(
    /<section\b[\s\S]*?<\/section>/,
    `<section aria-label="Lead story: ${s.title}"><Link href={root+"/articles/${s.slug}"}><h2>${s.title}</h2></Link></section>`,
  );
}

test('staged Marnie approval produces a complete read-only publication plan', (t) => {
  assert.equal(hash(marnieFront), fixture.provenance.placementSha256);
  const x = sandbox(t),
    before = snapshot(x.root),
    result = plan(x);
  assert.equal(result.summary.lead.slug, fixture.article.slug);
  assert.deepEqual(result.summary.carousel, x.change.carousel);
  assert.equal(result.summary.destinations[0].destination, 'archive');
  assert.equal(applyPrepared(result).written, false);
  assert.deepEqual(snapshot(x.root), before);
  assert.throws(() => applyPrepared(result, { write: true }), /Test-only/);
  assert.equal(
    JSON.parse(result.files[FILES.manifest]).baseline.approval.approvedBy,
    'Cody Chin',
  );
  assert.equal(
    inspectPlacement(result.files[FILES.front]).lead.slug,
    fixture.article.slug,
  );
  assert.ok(
    !JSON.parse(result.files[FILES.history])
      .records.at(-1)
      .placement.overflow.some((s) => s.slug === x.change.destinations[0].slug),
  );
});

test('unapproved, incomplete, stale and incorrectly scoped inputs are rejected', (t) => {
  for (const mutate of [
    (c) => delete c.approval,
    (c) => (c.approval.status = 'pending'),
    (c) => (c.approval.reference = ''),
    (c) => (c.editions = ['doge']),
    (c) => (c.expected.manifestSha256 = 'stale'),
    (c) => (c.testOnly = 'true'),
    (c) => (c.inferApprovalFromSite = true),
  ]) {
    const x = sandbox(t);
    mutate(x.change);
    assert.throws(() => plan(x));
  }
});

test('slugs, exact titles, global scope and three ordered unique cards are mandatory', (t) => {
  for (const mutate of [
    (c) => (c.lead.slug = '../unsafe'),
    (c) => (c.lead.title += ' wrong'),
    (c) => c.carousel.reverse(),
    (c) => c.carousel.push(c.carousel[0]),
    (c) => (c.carousel[1] = c.carousel[0]),
    (c) => (c.lead.slug = 'not-an-article'),
  ]) {
    const x = sandbox(t);
    mutate(x.change);
    assert.throws(() => plan(x));
  }
  const x = sandbox(t);
  const scope = path.join(x.root, 'lib/editorial-scope.js');
  fs.writeFileSync(
    scope,
    fs
      .readFileSync(scope, 'utf8')
      .replace(JSON.stringify(fixture.article.slug) + ',', ''),
  );
  x.change.expected = preconditions(validateRepository(x.root));
  assert.throws(() => plan(x), /global routing/);
});

test('a displaced story cannot disappear, remain on the front after archiving, or enter the wrong desk', (t) => {
  const x = sandbox(t);
  x.change.destinations = [];
  assert.throws(() => plan(x), /Missing displaced/);
  x.change.destinations = structuredClone(fixture.change.destinations);
  x.change.destinations[0].destination = 'culture';
  assert.throws(() => plan(x), /Culture article/);
  x.change.destinations[0].destination = 'archive';
  const west = fixture.change.destinations[0];
  const extra = `<section><Link href={root+"/articles/${west.slug}"}><h2>${west.title}</h2></Link></section>`;
  const candidate = marnieFront.replace(
    '<section className="hero heroStack"',
    extra + '<section className="hero heroStack"',
  );
  assert.throws(
    () => prepareChange(x.root, x.change, candidate),
    /still on editorial front/,
  );
  const missing = marnieFront.replace(
    x.r.placement.overflowMarkup['sabine-and-you-are'],
    '',
  );
  assert.throws(
    () => prepareChange(x.root, x.change, missing),
    /silently removed/,
  );
});

test('unchanged overflow, Culture content and code outside placement are preserved', (t) => {
  const x = sandbox(t);
  assert.throws(
    () =>
      prepareChange(
        x.root,
        x.change,
        marnieFront.replace('Ten great moments', 'Eleven great moments'),
      ),
    /copy\/media/,
  );
  assert.throws(
    () => prepareChange(x.root, x.change, '// unrelated code\n' + marnieFront),
    /outside editorial placement/,
  );
  const culture = x.r.culture.replace(
    'The Jumbotron Is the New Juilliard',
    'Changed culture copy',
  );
  assert.throws(
    () => prepareChange(x.root, x.change, marnieFront, culture),
    /Culture copy/,
  );
});

test('new chronology inversions fail unless specifically covered by the approval', (t) => {
  const x = sandbox(t),
    lead = story('marnie-joe-mixon-nostalgia-era', x.r);
  x.change.lead = lead;
  const candidate = replaceLead(marnieFront, lead);
  assert.throws(
    () => prepareChange(x.root, x.change, candidate),
    /chronology inversion/,
  );
  const p = inspectPlacement(candidate);
  x.change.chronologyOverrides = [...p.carousel, ...p.overflow]
    .filter(
      (s) =>
        Date.parse(x.r.catalog[s.slug].date) >
        Date.parse(x.r.catalog[lead.slug].date),
    )
    .map((s) => ({
      before: lead.slug,
      after: s.slug,
      reason:
        'Explicit synthetic feature-placement approval in disposable test repository',
    }));
  assert.doesNotThrow(() => prepareChange(x.root, x.change, candidate));
  x.change.chronologyOverrides[0].reason = '';
  assert.throws(
    () => prepareChange(x.root, x.change, candidate),
    /needs a reason/,
  );
});

test('an explicit Culture destination removes its homepage occurrence and keeps its scoped Culture link', (t) => {
  const x = sandbox(t),
    slug = 'marnie-time-traveling-goblin-paradox';
  x.change.destinations.push({ ...story(slug, x.r), destination: 'culture' });
  const p = prepareChange(
    x.root,
    x.change,
    marnieFront.replace(x.r.placement.overflowMarkup[slug], ''),
  );
  const record = JSON.parse(p.files[FILES.history]).records.at(-1);
  assert.ok(record.culture.some((s) => s.slug === slug));
  assert.ok(!record.placement.overflow.some((s) => s.slug === slug));
});

function noMove(t) {
  const x = sandbox(t, { marnie: false });
  x.change = {
    ...x.change,
    id: 'synthetic-approved-no-move',
    testOnly: false,
    lead: x.r.manifest.lead,
    carousel: x.r.manifest.carousel,
    destinations: [],
  };
  const candidate = x.r.front.replace(
    '<section className="morningBriefPreview sundayFront"',
    '<section\n className="morningBriefPreview sundayFront"',
  );
  return { ...x, prepared: prepareChange(x.root, x.change, candidate) };
}

test('write commits placement, manifest and append-only approval history as one local transaction', (t) => {
  const x = noMove(t),
    old = structuredClone(x.r.history.records),
    before = snapshot(x.root);
  assert.equal(applyPrepared(x.prepared, { write: true }).written, true);
  const r = validateRepository(x.root);
  assert.deepEqual(r.history.records.slice(0, -1), old);
  assert.equal(r.last.id, x.change.id);
  assert.notEqual(hash(r.front), hash(before[FILES.front]));
  assert.notEqual(r.manifestText, before[FILES.manifest]);
  assert.throws(
    () => prepareChange(x.root, x.change, r.front),
    /already applied/,
  );
});

test('a failed multi-file replacement restores every original byte and removes transaction files', (t) => {
  const x = noMove(t),
    before = snapshot(x.root);
  let count = 0;
  assert.throws(
    () =>
      applyPrepared(x.prepared, {
        write: true,
        replace: (a, b) => {
          if (++count === 2) throw Error('injected disk failure');
          fs.renameSync(a, b);
        },
      }),
    /injected disk failure/,
  );
  assert.deepEqual(snapshot(x.root), before);
  assert.ok(!fs.existsSync(path.join(x.root, '.editorial-publication.lock')));
  assert.ok(
    !fs
      .readdirSync(path.join(x.root, 'qa'))
      .some((f) => f.includes('.editorial-')),
  );
});

test('concurrent or changed-after-plan publications fail before replacing any file', (t) => {
  const x = noMove(t);
  fs.writeFileSync(
    path.join(x.root, '.editorial-publication.lock'),
    'other publisher',
  );
  const before = snapshot(x.root);
  assert.throws(() => applyPrepared(x.prepared, { write: true }), /EEXIST/);
  assert.deepEqual(snapshot(x.root), before);
  fs.unlinkSync(path.join(x.root, '.editorial-publication.lock'));
  fs.appendFileSync(path.join(x.root, FILES.manifest), '\n');
  assert.throws(
    () => applyPrepared(x.prepared, { write: true }),
    /changed since planning/,
  );
  assert.ok(!fs.existsSync(path.join(x.root, '.editorial-publication.lock')));
});

test('manifest drift, implementation drift and historical-record edits fail closed', (t) => {
  for (const kind of ['manifest', 'implementation', 'history']) {
    const x = sandbox(t);
    if (kind === 'manifest') {
      const m = structuredClone(x.r.manifest);
      m.carousel.reverse();
      fs.writeFileSync(path.join(x.root, FILES.manifest), JSON.stringify(m));
    }
    if (kind === 'implementation')
      fs.writeFileSync(path.join(x.root, FILES.front), marnieFront);
    if (kind === 'history') {
      const h = structuredClone(x.r.history);
      h.records[0].approval.approvedBy = 'Someone else';
      fs.writeFileSync(path.join(x.root, FILES.history), JSON.stringify(h));
    }
    assert.throws(() => validateRepository(x.root));
    const check = spawnSync(
      process.execPath,
      [path.join(repo, 'scripts/editorial/publish.mjs'), 'check'],
      { cwd: x.root, encoding: 'utf8' },
    );
    assert.equal(check.status, 1);
  }
});

test('previously published catalog URLs cannot be silently deleted', (t) => {
  const x = sandbox(t);
  const file = path.join(x.root, 'app/articles/data.js');
  fs.writeFileSync(
    file,
    fs
      .readFileSync(file, 'utf8')
      .replace(
        "'conrad-jalen-hurts-too-sick-to-sleep': conradJalenHurtsArticle,",
        '',
      ),
  );
  assert.throws(() => validateRepository(x.root), /Unknown article|removed/);
});

test('approval validation is offline and does not execute article modules or infer consent', (t) => {
  const x = sandbox(t);
  const previous = globalThis.fetch;
  globalThis.fetch = () => {
    throw Error('Network must not be used to infer approval');
  };
  try {
    assert.equal(applyPrepared(plan(x)).written, false);
  } finally {
    globalThis.fetch = previous;
  }
  delete x.change.approval;
  assert.throws(() => plan(x));
  fs.appendFileSync(
    path.join(x.root, 'app/articles/data.js'),
    "\nthrow new Error('ARTICLE MODULE WAS EXECUTED');\n",
  );
  assert.throws(
    () => validateRepository(x.root),
    /Unsupported article module statement/,
  );
});

test('dynamic headline suffixes and edition-breaking literal article links fail closed', (t) => {
  const x = sandbox(t);
  assert.throws(
    () =>
      prepareChange(
        x.root,
        x.change,
        marnieFront.replace(
          fixture.article.title + '</h2>',
          fixture.article.title + '{dynamicSuffix}</h2>',
        ),
      ),
    /Dynamic headlines/,
  );
  assert.throws(
    () =>
      prepareChange(
        x.root,
        x.change,
        marnieFront.replace(
          'href={root+"/articles/' + fixture.article.slug + '"}',
          'href="/articles/' + fixture.article.slug + '"',
        ),
      ),
    /Article links must/,
  );
});

test('executable metadata mutations and altered archive projections are rejected', (t) => {
  for (const mutation of ['initializer', 'archive']) {
    const x = sandbox(t),
      file = path.join(x.root, 'app/articles/data.js');
    let source = fs.readFileSync(file, 'utf8');
    source =
      mutation === 'initializer'
        ? source +
          '\nconst mutate = (() => { articles["conrad-jalen-hurts-too-sick-to-sleep"].title = "wrong"; })();\n'
        : source.replace(
            'Object.entries(articles).map',
            'Object.entries(articles).filter(() => false).map',
          );
    fs.writeFileSync(file, source);
    assert.throws(
      () => validateRepository(x.root),
      /Executable article metadata|Archive projection/,
    );
  }
});

test('archived global article routes remain available in all editions', (t) => {
  const x = sandbox(t);
  const scope = path.join(x.root, 'lib/editorial-scope.js');
  fs.writeFileSync(
    scope,
    fs
      .readFileSync(scope, 'utf8')
      .replace("  'hollis-arch-manning-compression',\n", ''),
  );
  assert.throws(
    () => validateRepository(x.root),
    /Previously global article route removed/,
  );
});

test('CLI previews staged Marnie without writing and rejects explicit fixture publication', (t) => {
  const x = sandbox(t),
    before = snapshot(x.root),
    input = path.join(x.root, 'approval-test-only.json');
  fs.writeFileSync(input, JSON.stringify(x.change));
  const args = [
    path.join(repo, 'scripts/editorial/publish.mjs'),
    'apply',
    '--change',
    input,
    '--placement',
    path.join(repo, 'tests/fixtures/editorial/staged-marnie-front.jsx'),
  ];
  const dry = spawnSync(process.execPath, args, {
    cwd: x.root,
    encoding: 'utf8',
  });
  assert.equal(dry.status, 0, dry.stderr);
  assert.equal(JSON.parse(dry.stdout).written, false);
  assert.equal(JSON.parse(dry.stdout).lead.slug, fixture.article.slug);
  const refused = spawnSync(process.execPath, [...args, '--write'], {
    cwd: x.root,
    encoding: 'utf8',
  });
  assert.equal(refused.status, 1);
  assert.match(refused.stderr, /Test-only/);
  assert.deepEqual(snapshot(x.root), before);
});

test('a displaced overflow story needs a real placement and explicit nonchronological exception', (t) => {
  const x = sandbox(t),
    west = x.change.destinations[0];
  west.destination = 'overflow';
  const block = `<section><Link href={root+"/articles/${west.slug}"}><h2>${west.title}</h2></Link></section>`;
  const candidate = marnieFront.replace(
    '<section className="hero heroStack"',
    block + '<section className="hero heroStack"',
  );
  assert.throws(
    () => prepareChange(x.root, x.change, candidate),
    /chronology inversion/,
  );
  x.change.chronologyOverrides = x.change.carousel
    .filter(
      (card) =>
        Date.parse(x.r.catalog[card.slug].date) <
        Date.parse(x.r.catalog[west.slug].date),
    )
    .map((card) => ({
      before: card.slug,
      after: west.slug,
      reason:
        'Explicit test approval retaining this displaced story below the fixed carousel',
    }));
  assert.doesNotThrow(() => prepareChange(x.root, x.change, candidate));
});

test('a new Culture placement is validated and included in the same proposed change set', (t) => {
  const x = sandbox(t),
    slug = 'marnie-marvin-harrison-somewhere-else',
    s = story(slug, x.r);
  x.change.destinations.push({ ...s, destination: 'culture' });
  const candidate = marnieFront.replace(x.r.placement.overflowMarkup[slug], '');
  const addition = {
    href: '/articles/' + slug,
    slug,
    title: s.title,
    editions: ['loog', 'sunday-crew', 'doge'],
  };
  const culture = x.r.culture.replace(
    'const stories=[',
    'const stories=[\n' + JSON.stringify(addition) + ',',
  );
  const close = x.r.culture.length - x.r.culturePlacement.suffix.length - 1;
  const lateCulture =
    x.r.culture.slice(0, close) +
    ',' +
    JSON.stringify(addition) +
    x.r.culture.slice(close);
  assert.throws(
    () => prepareChange(x.root, x.change, candidate, lateCulture),
    /Culture chronology/,
  );
  const prepared = prepareChange(x.root, x.change, candidate, culture);
  assert.ok(Object.hasOwn(prepared.files, FILES.culture));
  assert.equal(Object.keys(prepared.files).length, 4);
  const before = snapshot(x.root);
  applyPrepared(prepared);
  assert.deepEqual(snapshot(x.root), before);
});

test('dynamic extra cards and untracked editorial blocks cannot evade placement checks', (t) => {
  const x = sandbox(t);
  assert.throws(
    () =>
      prepareChange(
        x.root,
        x.change,
        marnieFront.replace(
          'aria-label="Recent stories">',
          'aria-label="Recent stories">{extraCard}',
        ),
      ),
    /dynamic editorial children/,
  );
  assert.throws(
    () =>
      prepareChange(
        x.root,
        x.change,
        marnieFront.replace(
          '<section className="hero heroStack"',
          '<div>Unrecorded story</div><section className="hero heroStack"',
        ),
      ),
    /untracked editorial content/,
  );
});
