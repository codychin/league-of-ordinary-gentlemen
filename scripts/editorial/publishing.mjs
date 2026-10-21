import { parse } from '@babel/parser';
import { createHash, randomUUID } from 'node:crypto';
import {
  readFileSync,
  writeFileSync,
  renameSync,
  unlinkSync,
  lstatSync,
  openSync,
  closeSync,
} from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';

export const FILES = {
  front: 'app/components/SharedEditorialFront.js',
  culture: 'app/components/CultureDesk.jsx',
  manifest: 'qa/editorial-release.json',
  history: 'qa/editorial-approval-history.json',
};
const EDITIONS = [
  { id: 'loog', path: '/' },
  { id: 'sunday-crew', path: '/sunday-crew' },
  { id: 'doge', path: '/doge' },
];
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const canonical = (value) =>
  JSON.stringify(value, (_, v) =>
    v && typeof v === 'object' && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([a], [b]) => a.localeCompare(b)),
        )
      : v,
  );
export const hash = (value) =>
  createHash('sha256')
    .update(typeof value === 'string' ? value : canonical(value))
    .digest('hex');
const read = (root, file) => readFileSync(path.join(root, file), 'utf8');
const json = (value) => JSON.stringify(value, null, 2) + '\n';
const ast = (source) =>
  parse(source, { sourceType: 'module', plugins: ['jsx'] });
const children = (node) => {
  for (const child of node.children || []) {
    if (child.type === 'JSXElement') continue;
    if (child.type === 'JSXText' && !child.value.trim()) continue;
    if (
      child.type === 'JSXExpressionContainer' &&
      child.expression.type === 'JSXEmptyExpression'
    )
      continue;
    throw Error(
      'Unsupported dynamic editorial children; placement cannot be verified',
    );
  }
  return (node.children || []).filter((n) => n.type === 'JSXElement');
};
const tag = (node) => node?.openingElement?.name?.name;
const attr = (node, name) =>
  node.openingElement.attributes.find((a) => a.name?.name === name)?.value;
function walk(node, fn) {
  if (!node || typeof node !== 'object') return;
  fn(node);
  for (const [key, value] of Object.entries(node)) {
    if (['loc', 'extra'].includes(key)) continue;
    if (Array.isArray(value)) value.forEach((n) => walk(n, fn));
    else if (value && typeof value === 'object') walk(value, fn);
  }
}
function literal(node) {
  if (
    node?.type === 'StringLiteral' ||
    node?.type === 'NumericLiteral' ||
    node?.type === 'BooleanLiteral'
  )
    return node.value;
  throw Error('Expected a static literal');
}
const propName = (node) => node.key?.name ?? node.key?.value;
function heading(node, level) {
  const found = [];
  walk(node, (n) => {
    if (n.type === 'JSXElement' && tag(n) === level) found.push(n);
  });
  assert.equal(found.length, 1, `Expected one ${level} headline`);
  let text = '';
  walk(found[0], (n) => {
    if (n.type === 'JSXText') text += n.value;
    if (n.type === 'JSXExpressionContainer') {
      if (n.expression.type === 'JSXEmptyExpression') return;
      assert.equal(
        n.expression.type,
        'StringLiteral',
        'Dynamic headlines cannot be verified',
      );
      text += n.expression.value;
    }
  });
  return text.replace(/\s+/g, ' ').trim();
}
function slugFromHref(node) {
  const expression =
    node?.type === 'JSXExpressionContainer' ? node.expression : null;
  assert.ok(
    expression,
    'Article links must use root + a literal /articles/slug',
  );
  if (
    expression.type !== 'BinaryExpression' ||
    expression.operator !== '+' ||
    expression.left.type !== 'Identifier' ||
    expression.left.name !== 'root'
  )
    throw Error('Article links must use root + a literal /articles/slug');
  const value = literal(expression.right);
  assert.match(value, /^\/articles\/[a-z0-9-]+$/);
  return value.slice('/articles/'.length);
}
function story(node, level) {
  const slugs = [];
  walk(node, (n) => {
    if (n.type === 'JSXElement' && tag(n) === 'Link') {
      const href = attr(n, 'href');
      if (href) {
        const slug = slugFromHref(href);
        if (slug) slugs.push(slug);
      }
    }
  });
  assert.equal(
    new Set(slugs).size,
    1,
    'Each story must link to exactly one article',
  );
  return { slug: slugs[0], title: heading(node, level) };
}
export function inspectPlacement(source) {
  const tree = ast(source);
  const declaration = tree.program.body.find(
    (n) => n.type === 'ExportDefaultDeclaration',
  )?.declaration;
  assert.equal(
    declaration?.id?.name,
    'SharedEditorialFront',
    'Expected SharedEditorialFront function',
  );
  const fragment = declaration.body.body.find(
    (n) => n.type === 'ReturnStatement',
  )?.argument;
  assert.equal(
    fragment?.type,
    'JSXFragment',
    'Expected a static editorial fragment',
  );
  const elements = children(fragment);
  const sections = elements.filter((n) => tag(n) === 'section');
  assert.equal(
    elements.length,
    sections.length + 1,
    'Unexpected untracked editorial content',
  );
  assert.equal(tag(elements.at(-1)), 'div', 'Expected the final archive CTA');
  assert.ok(
    elements.slice(0, -1).every((n) => tag(n) === 'section'),
    'Untracked editorial content between stories',
  );
  assert.ok(
    sections.length > 2,
    'Editorial front needs lead, carousel and overflow',
  );
  assert.equal(elements[0], sections[0]);
  assert.equal(
    elements[1],
    sections[1],
    'Carousel must immediately follow the lead',
  );
  assert.ok(
    attr(sections[0], 'aria-label')?.value?.startsWith('Lead story:'),
    'Missing lead section',
  );
  assert.equal(
    attr(sections[1], 'aria-label')?.value,
    'Recent stories',
    'Missing carousel section',
  );
  const cards = children(sections[1]);
  assert.equal(cards.length, 3, 'Carousel must contain exactly three cards');
  assert.ok(
    cards.every((n) => tag(n) === 'article'),
    'Carousel contains non-card content',
  );
  const lead = story(sections[0], 'h2'),
    carousel = cards.map((n) => story(n, 'h3')),
    overflow = sections.slice(2).map((n) => story(n, 'h2'));
  const all = [lead, ...carousel, ...overflow];
  assert.equal(
    new Set(all.map((s) => s.slug)).size,
    all.length,
    'Duplicate story placement',
  );
  return {
    lead,
    carousel,
    overflow,
    prefix: source.slice(0, sections[0].start),
    suffix: source.slice(sections.at(-1).end),
    overflowMarkup: Object.fromEntries(
      overflow.map((s, i) => [
        s.slug,
        source.slice(sections[i + 2].start, sections[i + 2].end),
      ]),
    ),
  };
}

// Read metadata through a restricted AST interpreter. Never import/execute app code.
export function readCatalog(root) {
  const cache = new Map();
  function module(file) {
    const full = path.resolve(root, file);
    assert.ok(
      full.startsWith(path.resolve(root) + path.sep),
      'Catalog import escaped repository',
    );
    if (cache.has(full)) return cache.get(full);
    const tree = ast(readFileSync(full, 'utf8'));
    const bindings = new Map(),
      imports = new Map(),
      exports = new Set();
    for (const node of tree.program.body) {
      assert.ok(
        [
          'ImportDeclaration',
          'ExportNamedDeclaration',
          'VariableDeclaration',
          'EmptyStatement',
        ].includes(node.type),
        'Unsupported article module statement; dynamic metadata mutations cannot be verified',
      );
      if (node.type === 'ImportDeclaration')
        for (const s of node.specifiers) {
          assert.equal(
            s.type,
            'ImportSpecifier',
            'Only named article imports supported',
          );
          let target = path.resolve(path.dirname(full), node.source.value);
          if (!path.extname(target)) target += '.js';
          imports.set(s.local.name, { file: target, name: s.imported.name });
        }
      const d =
        node.type === 'ExportNamedDeclaration' ? node.declaration : node;
      if (d?.type === 'VariableDeclaration')
        for (const v of d.declarations) {
          // Metadata initializers must not mutate other article records at load
          // time. The archive's one known pure projection is checked separately.
          if (
            !(
              full === path.resolve(root, 'app/articles/data.js') &&
              v.id.name === 'archive'
            )
          ) {
            walk(v.init, (n) => {
              assert.ok(
                ![
                  'CallExpression',
                  'NewExpression',
                  'AssignmentExpression',
                  'UpdateExpression',
                  'AwaitExpression',
                  'TaggedTemplateExpression',
                ].includes(n.type),
                'Executable article metadata initializer cannot be verified',
              );
            });
          }
          bindings.set(v.id.name, v.init);
          if (node.type === 'ExportNamedDeclaration') exports.add(v.id.name);
        }
    }
    const state = { tree, bindings, imports, exports };
    cache.set(full, state);
    return state;
  }
  function object(file, node, seen = new Set()) {
    if (node.type === 'Identifier') {
      const key = file + ':' + node.name;
      assert.ok(!seen.has(key), 'Circular article metadata');
      seen = new Set([...seen, key]);
      const m = module(file),
        i = m.imports.get(node.name);
      if (i) {
        const imported = module(i.file);
        assert.ok(
          imported.exports.has(i.name),
          'Imported article binding is not exported',
        );
        return object(i.file, imported.bindings.get(i.name), seen);
      }
      assert.ok(m.bindings.has(node.name), 'Unknown article metadata binding');
      return object(file, m.bindings.get(node.name), seen);
    }
    assert.equal(
      node?.type,
      'ObjectExpression',
      'Article must have static metadata',
    );
    const result = {};
    for (const p of node.properties) {
      if (p.type !== 'ObjectProperty')
        throw Error('Metadata spreads/methods require explicit support');
      const key = propName(p);
      if (['title', 'date', 'section'].includes(key))
        result[key] = literal(p.value);
    }
    return result;
  }
  const file = path.resolve(root, 'app/articles/data.js'),
    m = module(file),
    articles = m.bindings.get('articles');
  const shape = (node) =>
    JSON.parse(
      JSON.stringify(node, (key, value) =>
        [
          'start',
          'end',
          'loc',
          'extra',
          'leadingComments',
          'trailingComments',
          'innerComments',
        ].includes(key)
          ? undefined
          : value,
      ),
    );
  const archiveProjection = ast(
    'export const archive=Object.entries(articles).map(([slug,a])=>({slug,...a})).sort((a,b)=>b.week-a.week)',
  ).program.body[0].declaration.declarations[0].init;
  assert.deepEqual(
    shape(m.bindings.get('archive')),
    shape(archiveProjection),
    'Archive projection must preserve every published article unchanged',
  );
  assert.equal(articles?.type, 'ObjectExpression');
  const catalog = {};
  for (const p of articles.properties) {
    assert.equal(p.type, 'ObjectProperty');
    const slug = propName(p);
    assert.match(slug, SLUG);
    assert.ok(!Object.hasOwn(catalog, slug), 'Duplicate catalog slug');
    catalog[slug] = object(file, p.value);
  }
  return catalog;
}
function globalSlugs(source) {
  let result;
  walk(ast(source), (n) => {
    if (
      n.type === 'VariableDeclarator' &&
      n.id.name === 'GLOBAL_ARTICLE_SLUGS'
    ) {
      assert.equal(n.init.type, 'NewExpression');
      assert.equal(n.init.callee.name, 'Set');
      assert.equal(n.init.arguments[0].type, 'ArrayExpression');
      result = n.init.arguments[0].elements.map(literal);
    }
  });
  assert.ok(result?.length, 'Missing explicit global scope');
  return new Set(result);
}
export function inspectCulture(source) {
  const items = [];
  let list;
  walk(ast(source), (n) => {
    if (n.type === 'VariableDeclarator' && n.id.name === 'stories')
      list = n.init;
  });
  assert.equal(
    list?.type,
    'ArrayExpression',
    'Expected static culture stories',
  );
  for (const node of list.elements) {
    const p = node.properties?.find((p) => propName(p) === 'slug');
    if (!p) continue;
    const slug = literal(p.value);
    const title = literal(
      node.properties.find((p) => propName(p) === 'title').value,
    );
    const e = node.properties.find((p) => propName(p) === 'editions');
    items.push({
      slug,
      title,
      editions: e ? e.value.elements.map(literal) : EDITIONS.map((e) => e.id),
      markup: source.slice(node.start, node.end),
    });
  }
  assert.equal(
    new Set(items.map((s) => s.slug)).size,
    items.length,
    'Duplicate Culture story',
  );
  return {
    items,
    prefix: source.slice(0, list.start),
    suffix: source.slice(list.end),
  };
}
const publicPlacement = (p) => ({
  lead: p.lead,
  carousel: p.carousel,
  overflow: p.overflow,
});
function validateStory(story, catalog, scope, variants = {}) {
  assert.match(story.slug, SLUG);
  const article = catalog[story.slug];
  assert.ok(article, `Unknown article slug: ${story.slug}`);
  if (story.title !== article.title)
    assert.deepEqual(
      variants[story.slug],
      { rendered: story.title, catalog: article.title },
      `Title mismatch: ${story.slug}`,
    );
  assert.ok(
    scope.has(story.slug),
    `Shared story lacks global routing: ${story.slug}`,
  );
  assert.ok(
    Number.isFinite(Date.parse(article.date)),
    `Missing publication date: ${story.slug}`,
  );
}
function inversions(p, catalog) {
  return orderedInversions([p.lead, ...p.carousel, ...p.overflow], catalog);
}
function orderedInversions(stories, catalog) {
  const result = [];
  for (let i = 0; i < stories.length; i++)
    for (let j = i + 1; j < stories.length; j++)
      if (
        Date.parse(catalog[stories[i].slug]?.date) <
        Date.parse(catalog[stories[j].slug]?.date)
      )
        result.push({ before: stories[i].slug, after: stories[j].slug });
  return result;
}
const pair = (x) => x.before + '>' + x.after;
export function readRepository(root) {
  const front = read(root, FILES.front),
    culture = read(root, FILES.culture),
    manifestText = read(root, FILES.manifest),
    history = JSON.parse(read(root, FILES.history));
  return {
    front,
    culture,
    manifestText,
    manifest: JSON.parse(manifestText),
    history,
    catalog: readCatalog(root),
    scope: globalSlugs(read(root, 'lib/editorial-scope.js')),
  };
}
function validateArchiveContract(root) {
  assert.match(
    read(root, 'app/articles/data.js'),
    /export const archive\s*=\s*Object\.entries\(articles\)\.map/,
    'Archive must retain all catalog articles',
  );
  assert.match(
    read(root, 'app/archive/page.js'),
    /import\s*\{archive\}\s*from/,
  );
  assert.match(
    read(root, 'app/components/editions/Archive.js'),
    /archive\.filter\(a=>isGlobalArticle\(a.slug\)\)/,
  );
  assert.match(read(root, 'app/page.js'), /<SharedEditorialFront\s*\/>/);
  assert.match(
    read(root, 'app/components/editions/Home.js'),
    /<SharedEditorialFront root=\{root\}/,
  );
}
export function seal(record, previous = null) {
  const value = { ...record, previousRecordHash: previous?.recordHash ?? null };
  return { ...value, recordHash: hash(value) };
}
function verifyHistory(history) {
  assert.equal(history.schemaVersion, 1);
  assert.ok(history.records.length, 'Empty approval history');
  const ids = new Set();
  let previous = null;
  for (const r of history.records) {
    assert.ok(!ids.has(r.id), 'Duplicate approval id');
    ids.add(r.id);
    assert.equal(
      r.manifest.baseline.status,
      'editorially-approved',
      'Approval record is not approved',
    );
    if (previous) {
      assert.equal(r.approval.status, 'approved');
      assert.deepEqual(r.approval, r.change.approval);
      assert.equal(r.id, r.change.id);
      assert.deepEqual(r.manifest.lead, r.change.lead);
      assert.deepEqual(r.manifest.carousel, r.change.carousel);
      assert.equal(r.manifest.baseline.approvalId, r.id);
    }
    const { recordHash, ...payload } = r;
    assert.equal(
      payload.previousRecordHash,
      previous?.recordHash ?? null,
      'Broken approval history chain',
    );
    assert.equal(
      recordHash,
      hash(payload),
      'Historical approval record was changed',
    );
    previous = r;
  }
  return previous;
}
export function validateRepository(root) {
  const r = readRepository(root),
    p = inspectPlacement(r.front),
    culture = inspectCulture(r.culture),
    last = verifyHistory(r.history);
  assert.deepEqual(
    r.manifest,
    last.manifest,
    'Manifest differs from recorded approved release',
  );
  assert.deepEqual(
    publicPlacement(p),
    last.placement,
    'Implementation differs from recorded placement',
  );
  assert.deepEqual(
    r.manifest.editions,
    EDITIONS,
    'Shared editorial changes require all three editions',
  );
  assert.deepEqual(
    r.manifest.lead,
    p.lead,
    'Manifest/implementation lead mismatch',
  );
  assert.deepEqual(
    r.manifest.carousel,
    p.carousel,
    'Manifest/implementation carousel mismatch',
  );
  for (const s of [p.lead, ...p.carousel]) validateStory(s, r.catalog, r.scope);
  for (const s of p.overflow)
    validateStory(s, r.catalog, r.scope, last.legacyTitleVariants);
  for (const slug of last.catalogSlugs)
    assert.ok(r.catalog[slug], `Previously published article removed: ${slug}`);
  for (const slug of last.globalSlugs)
    assert.ok(
      r.scope.has(slug),
      `Previously global article route removed: ${slug}`,
    );
  assert.deepEqual(
    culture.items.map(({ markup, ...s }) => s),
    last.culture,
    'Culture placement differs from approval record',
  );
  const allowed = new Set(last.chronologyExceptions.map(pair));
  for (const x of inversions(p, r.catalog))
    assert.ok(
      allowed.has(pair(x)),
      `Unapproved chronology inversion: ${pair(x)}`,
    );
  for (const s of culture.items)
    if (!r.catalog[s.slug])
      assert.ok(
        last.legacyUncataloguedCulture.includes(s.slug),
        `Unknown Culture article: ${s.slug}`,
      );
  const cultureAllowed = new Set(last.cultureChronologyExceptions.map(pair));
  for (const x of orderedInversions(culture.items, r.catalog))
    assert.ok(
      cultureAllowed.has(pair(x)),
      `Unapproved Culture chronology inversion: ${pair(x)}`,
    );
  validateArchiveContract(root);
  return { ...r, placement: p, culturePlacement: culture, last };
}
export function preconditions(r) {
  return {
    manifestSha256: hash(r.manifestText),
    placementSha256: hash(r.front),
    cultureSha256: hash(r.culture),
    catalogSha256: hash(r.catalog),
    historySha256: hash(r.history),
    globalScopeSha256: hash([...r.scope].sort()),
  };
}
function exactKeys(object, keys, label) {
  assert.ok(
    object && typeof object === 'object' && !Array.isArray(object),
    `${label} must be an object`,
  );
  for (const key of Object.keys(object))
    assert.ok(keys.includes(key), `Unknown ${label} field: ${key}`);
}
export function prepareChange(root, change, candidate, cultureCandidate) {
  const r = validateRepository(root);
  exactKeys(
    change,
    [
      'schemaVersion',
      'id',
      'approval',
      'editions',
      'lead',
      'carousel',
      'destinations',
      'chronologyOverrides',
      'expected',
      'testOnly',
    ],
    'change',
  );
  assert.equal(change.schemaVersion, 1);
  if (change.testOnly !== undefined)
    assert.equal(typeof change.testOnly, 'boolean');
  assert.match(change.id, /^[a-z0-9][a-z0-9-]{2,100}$/);
  assert.ok(
    !r.history.records.some((x) => x.id === change.id),
    'Approval id already applied',
  );
  exactKeys(
    change.approval,
    ['status', 'approvedBy', 'approvedAt', 'reference', 'environment'],
    'approval',
  );
  assert.equal(
    change.approval.status,
    'approved',
    'Explicit editorial approval is required',
  );
  for (const field of ['approvedBy', 'reference'])
    assert.ok(
      typeof change.approval[field] === 'string' &&
        change.approval[field].trim(),
      `Missing approval ${field}`,
    );
  assert.match(
    change.approval.approvedAt,
    /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z)?$/,
  );
  assert.ok(Number.isFinite(Date.parse(change.approval.approvedAt)));
  assert.ok(['staging', 'production'].includes(change.approval.environment));
  assert.deepEqual(
    change.expected,
    preconditions(r),
    'Stale approval preconditions: re-review the current files/catalog',
  );
  assert.deepEqual(
    [...change.editions].sort(),
    EDITIONS.map((x) => x.id).sort(),
    'Shared global layout requires explicit approval for all three editions',
  );
  assert.ok(Array.isArray(change.carousel));
  assert.equal(
    change.carousel.length,
    3,
    'Approval must specify exactly three ordered carousel stories',
  );
  for (const s of [change.lead, ...change.carousel]) {
    exactKeys(s, ['slug', 'title'], 'story');
    validateStory(s, r.catalog, r.scope);
  }
  const p = inspectPlacement(candidate),
    c = inspectCulture(cultureCandidate ?? r.culture);
  assert.deepEqual(
    p.lead,
    change.lead,
    'Candidate lead differs from approved change',
  );
  assert.deepEqual(
    p.carousel,
    change.carousel,
    'Candidate card order differs from approved change',
  );
  assert.equal(
    p.prefix,
    r.placement.prefix,
    'Candidate changes code outside editorial placement',
  );
  assert.equal(
    p.suffix,
    r.placement.suffix,
    'Candidate changes code outside editorial placement',
  );
  assert.equal(c.prefix, r.culturePlacement.prefix);
  assert.equal(c.suffix, r.culturePlacement.suffix);
  for (const s of [p.lead, ...p.carousel]) validateStory(s, r.catalog, r.scope);
  for (const s of p.overflow)
    validateStory(s, r.catalog, r.scope, r.last.legacyTitleVariants);
  const top = new Set([p.lead, ...p.carousel].map((s) => s.slug)),
    home = new Set([...top, ...p.overflow.map((s) => s.slug)]);
  assert.ok(
    Array.isArray(change.destinations),
    'Explicit displaced-story destinations are required',
  );
  const destinations = new Map();
  for (const d of change.destinations) {
    exactKeys(d, ['slug', 'title', 'destination'], 'destination');
    validateStory(d, r.catalog, r.scope);
    assert.ok(!destinations.has(d.slug), 'Duplicate destination');
    assert.ok(!top.has(d.slug), 'Top story also has a displaced destination');
    assert.ok(
      ['overflow', 'culture', 'archive'].includes(d.destination),
      'Unknown destination',
    );
    destinations.set(d.slug, d);
    const inCulture = c.items.find((s) => s.slug === d.slug);
    if (d.destination === 'overflow') {
      assert.deepEqual(
        p.overflow.find((s) => s.slug === d.slug),
        { slug: d.slug, title: d.title },
        `Displaced story missing/mistitled in overflow: ${d.slug}`,
      );
      assert.ok(
        !inCulture,
        `Overflow destination also remains in Culture: ${d.slug}`,
      );
    } else
      assert.ok(
        !home.has(d.slug),
        `Displaced story still on editorial front: ${d.slug}`,
      );
    if (d.destination === 'archive')
      assert.ok(!inCulture, `Archived story still on Culture: ${d.slug}`);
    if (d.destination === 'culture') {
      assert.match(
        r.catalog[d.slug].section,
        /^MATTERS OF CULTURE/,
        'Culture destination requires a Culture article',
      );
      assert.ok(inCulture, `Culture destination missing: ${d.slug}`);
      assert.equal(inCulture.title, d.title);
      assert.deepEqual(
        [...inCulture.editions].sort(),
        [...change.editions].sort(),
        'Culture destination has wrong edition scope',
      );
    }
  }
  for (const s of [r.placement.lead, ...r.placement.carousel])
    if (!top.has(s.slug))
      assert.ok(
        destinations.has(s.slug),
        `Missing displaced-story destination: ${s.slug}`,
      );
  for (const s of r.placement.overflow)
    if (!home.has(s.slug))
      assert.ok(
        destinations.has(s.slug),
        `Overflow story silently removed: ${s.slug}`,
      );
  for (const s of p.overflow)
    if (!r.placement.overflow.some((x) => x.slug === s.slug))
      assert.equal(
        destinations.get(s.slug)?.destination,
        'overflow',
        `New overflow placement lacks approval: ${s.slug}`,
      );
  const retained = r.placement.overflow
    .filter((s) => !top.has(s.slug) && !destinations.has(s.slug))
    .map((s) => s.slug);
  assert.deepEqual(
    p.overflow.filter((s) => retained.includes(s.slug)).map((s) => s.slug),
    retained,
    'Unchanged overflow was reordered',
  );
  for (const slug of retained)
    assert.equal(
      p.overflowMarkup[slug],
      r.placement.overflowMarkup[slug],
      `Unchanged overflow copy/media modified: ${slug}`,
    );
  for (const s of c.items) {
    const old = r.culturePlacement.items.find((x) => x.slug === s.slug);
    if (!old)
      assert.equal(
        destinations.get(s.slug)?.destination,
        'culture',
        'Unapproved Culture addition',
      );
    else assert.equal(s.markup, old.markup, 'Unapproved Culture copy change');
  }
  for (const s of r.culturePlacement.items)
    if (!c.items.some((x) => x.slug === s.slug))
      assert.ok(destinations.has(s.slug), 'Unapproved Culture removal');
  const retainedCulture = r.culturePlacement.items
    .filter((s) => !destinations.has(s.slug))
    .map((s) => s.slug);
  assert.deepEqual(
    c.items.filter((s) => retainedCulture.includes(s.slug)).map((s) => s.slug),
    retainedCulture,
    'Unchanged Culture stories were reordered',
  );
  const exceptions = [...r.last.chronologyExceptions];
  assert.ok(
    Array.isArray(change.chronologyOverrides),
    'Explicit chronologyOverrides array is required',
  );
  for (const x of change.chronologyOverrides) {
    exactKeys(x, ['before', 'after', 'reason'], 'chronology override');
    const surfaces = new Set([...home, ...c.items.map((s) => s.slug)]);
    assert.ok(surfaces.has(x.before) && surfaces.has(x.after));
    assert.ok(
      typeof x.reason === 'string' && x.reason.trim(),
      'Chronology override needs a reason',
    );
    exceptions.push(x);
  }
  const allowed = new Set(exceptions.map(pair));
  for (const x of inversions(p, r.catalog))
    assert.ok(
      allowed.has(pair(x)),
      `New chronology inversion requires explicit approval: ${pair(x)}`,
    );
  const cultureExceptions = [
    ...r.last.cultureChronologyExceptions,
    ...change.chronologyOverrides,
  ];
  const cultureAllowed = new Set(cultureExceptions.map(pair));
  for (const x of orderedInversions(c.items, r.catalog))
    assert.ok(
      cultureAllowed.has(pair(x)),
      `New Culture chronology inversion requires explicit approval: ${pair(x)}`,
    );
  const manifest = {
    ...r.manifest,
    baseline: {
      status: 'editorially-approved',
      source: FILES.front,
      approval: change.approval,
      approvalId: change.id,
    },
    lead: change.lead,
    carousel: change.carousel,
  };
  const record = seal(
    {
      id: change.id,
      approval: change.approval,
      change,
      manifest,
      placement: publicPlacement(p),
      culture: c.items.map(({ markup, ...s }) => s),
      catalogSlugs: Object.keys(r.catalog).sort(),
      globalSlugs: [...r.scope].sort(),
      legacyUncataloguedCulture: r.last.legacyUncataloguedCulture,
      legacyTitleVariants: r.last.legacyTitleVariants,
      cultureChronologyExceptions: cultureExceptions,
      chronologyExceptions: exceptions,
    },
    r.last,
  );
  const history = { ...r.history, records: [...r.history.records, record] };
  const files = {
    [FILES.front]: candidate,
    [FILES.manifest]: json(manifest),
    [FILES.history]: json(history),
  };
  if (cultureCandidate !== undefined && cultureCandidate !== r.culture)
    files[FILES.culture] = cultureCandidate;
  return {
    root,
    change,
    files,
    expected: preconditions(r),
    summary: {
      approvalId: change.id,
      testOnly: change.testOnly === true,
      editions: change.editions,
      lead: change.lead,
      carousel: change.carousel,
      destinations: change.destinations,
      files: Object.keys(files),
    },
  };
}

// A local multi-file transaction: validate everything before writes; rollback every
// original byte if any replacement fails. Git commit is still a separate reviewed step.
export function applyPrepared(
  plan,
  { write = false, replace = renameSync } = {},
) {
  if (!write) {
    assert.deepEqual(
      preconditions(validateRepository(plan.root)),
      plan.expected,
      'Repository changed since planning',
    );
    return { ...plan.summary, written: false };
  }
  assert.notEqual(
    plan.change.testOnly,
    true,
    'Test-only approvals cannot be written',
  );
  const lock = path.join(plan.root, '.editorial-publication.lock');
  const fd = openSync(lock, 'wx');
  const originals = new Map(),
    temps = [];
  const id = randomUUID();
  try {
    assert.deepEqual(
      preconditions(validateRepository(plan.root)),
      plan.expected,
      'Repository changed since planning',
    );
    for (const [file, content] of Object.entries(plan.files)) {
      const target = path.join(plan.root, file);
      assert.ok(
        !lstatSync(target).isSymbolicLink(),
        'Refusing symlink publication target',
      );
      originals.set(target, readFileSync(target));
      const temp = target + '.editorial-' + id;
      writeFileSync(temp, content, { flag: 'wx' });
      temps.push([temp, target]);
    }
    for (const [temp, target] of temps) replace(temp, target);
    validateRepository(plan.root);
  } catch (error) {
    for (const [target, bytes] of originals) writeFileSync(target, bytes);
    throw error;
  } finally {
    closeSync(fd);
    unlinkSync(lock);
    for (const [temp] of temps)
      try {
        unlinkSync(temp);
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
  }
  return { ...plan.summary, written: true };
}

export function seedHistory(root) {
  const front = read(root, FILES.front),
    culture = inspectCulture(read(root, FILES.culture)),
    manifest = JSON.parse(read(root, FILES.manifest)),
    catalog = readCatalog(root),
    p = inspectPlacement(front),
    scope = globalSlugs(read(root, 'lib/editorial-scope.js'));
  assert.equal(
    manifest.baseline.status,
    'editorially-approved',
    'Cannot bootstrap approval from implementation alone',
  );
  assert.deepEqual(manifest.lead, p.lead);
  assert.deepEqual(manifest.carousel, p.carousel);
  const legacyTitleVariants = {};
  for (const s of p.overflow)
    if (catalog[s.slug] && s.title !== catalog[s.slug].title)
      legacyTitleVariants[s.slug] = {
        rendered: s.title,
        catalog: catalog[s.slug].title,
      };
  for (const s of [p.lead, ...p.carousel]) validateStory(s, catalog, scope);
  for (const s of p.overflow)
    validateStory(s, catalog, scope, legacyTitleVariants);
  return {
    schemaVersion: 1,
    records: [
      seal({
        id: 'phase-one-conrad-20261021',
        approval: manifest.baseline.approval,
        manifest,
        placement: publicPlacement(p),
        culture: culture.items.map(({ markup, ...s }) => s),
        catalogSlugs: Object.keys(catalog).sort(),
        globalSlugs: [...scope].sort(),
        legacyUncataloguedCulture: culture.items
          .filter((s) => !catalog[s.slug])
          .map((s) => s.slug),
        legacyTitleVariants,
        cultureChronologyExceptions: orderedInversions(
          culture.items,
          catalog,
        ).map((x) => ({
          ...x,
          reason: 'Pre-existing Culture order preserved at workflow adoption.',
        })),
        chronologyExceptions: inversions(p, catalog).map((x) => ({
          ...x,
          reason:
            'Pre-existing overflow placement preserved at workflow adoption; not a new editorial approval.',
        })),
        provenance:
          'Existing explicit Phase One approval in qa/editorial-release.json; no site observation used. Lead/card approval retained verbatim. Overflow exceptions are historical preservation only.',
      }),
    ],
  };
}
