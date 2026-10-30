import {writers, writerFor} from '../app/articles/writers.js';

export const CRATE_TOPICS = ['Football & Tactics', 'Money & Power', 'Fame & Personality', 'Culture & Absurdity'];
export const FEATURED_CRATE_SLUGS = ['marnie-corgi-he-wanted-them-to-know', 'hollis-jameis-winston-turing-test', 'dashiell-favorite-team-asset-class'];
// Article-level editorial assignments. A writer's identity never determines a topic.
const assignments = [
  ['Football & Tactics', [
    'maude-saturation-bombing-daniel-jones',

    'maude-nfc-east-declines-winner',
    'marnie-paying-retail', 'maude-jordan-love-alibis', 'maude-rams-without-puka',
    'conrad-caleb-williams-survived', 'maude-route-22-trade-review',
    'maude-monday-night-survival-board', 'maude-jayden-daniels-elbow',
    'hollis-uprights-reality', 'sabine-all-ugly-lloyd', 'conrad-kupp-kraft-keenan',
    'conrad-danir-ceedeep-hole', 'dashiell-route-22-portfolio', 'maude-sunday-board-week-2',
    'danir-emergency-jobs-program', 'route-22-phones', 'league-unbearable-tnf',
    'danir-bench-crime',  'all-ugly-process',
  ]],
  ['Money & Power', [
    'hollis-one-second',
    'conrad-jalen-hurts-too-sick-to-sleep',
    'dashiell-jaguars-london-future', 'conrad-white-coaches-lose-individually',
    'conrad-deshaun-watson-cleveland-hope', 'dashiell-man-city-infrastructure',
    'sabine-michigan-money-privilege-impatience', 'dashiell-favorite-team-asset-class',
    'conrad-york-wrong-160',
  ]],
  ['Fame & Personality', [
    'marnie-tilly-cantonese',
    'conrad-allow-me-to-reintroduce-myself', 'sabine-and-you-are',
    'hollis-mike-ditka-juice-box-guy', 'marnie-joe-mixon-nostalgia-era',
    'hollis-bryce-young-good-time', 'hollis-jameis-winston-turing-test',
    'marnie-nine-new-york', 'marnie-jumbotron-juilliard', 'hollis-arch-manning-compression',
     'marnie-colorado-content-football',
    'marnie-cruise-swift-football',
  ]],
  ['Culture & Absurdity', [
    'hopkins-opus-statement',
    'stone-unc-denial',
    'sydney-sweeney-consensus',
    'nigella-shake-n-baker',
    'sabine-chest-statement',
    'marnie-marvin-harrison-somewhere-else',
    'hollis-rams-kicker-weight',
    'hollis-west-virginia-medical-assistance',
    'marnie-detroit-school', 'marnie-delicate-etiquette-sporting-pat',
    'marnie-hecklinski-use-your-words', 'marnie-time-traveling-goblin-paradox',
    'conrad-tomlin-minecraft-cvs', 'marnie-corgi-he-wanted-them-to-know',
    'marnie-tee-higgins-ankles', 'sabine-sunday-maracana', 'marnie-manifest-destiny-wembley',
     'hollis-body-keeps-score',
    'hollis-kash-folder', 'upper-east-side-froyo', 'group-chat-investigation', 'sources-familiar',
  ]],
];
export const CRATE_ARTICLE_TOPICS = Object.fromEntries(assignments.flatMap(([topic, slugs])=>slugs.map(slug=>[slug,topic])));
export function topicForArticle(article) {
  // New stories remain searchable under Everything until editorially categorized.
  return CRATE_ARTICLE_TOPICS[article.slug] || null;
}
// Reuse the images already paired with these stories in CultureDesk.
// Card metadata only: original article media and bodies remain untouched.
const existingCardImages = {
  'conrad-white-coaches-lose-individually': {
    src:'/images/cache/c742e772e13ac464c87f-1280.webp',
    alt:'Aaron Glenn speaking at a New York Jets press conference',
  },
  'marnie-cruise-swift-football': {
    src:'/images/cache/6ce895486632f983c1e0-1280.webp',
    alt:'Taylor Swift cheering from a stadium suite',
  },
};
export function crateArticle(article, root='') {
  const writer = writers[article.writer_slug || article.author] || writerFor(article.slug);
  const timestamp = Date.parse(article.published_at || article.date || '');
  const isoDate = Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
  const date = article.date || (isoDate ? new Date(timestamp).toLocaleDateString('en-US', {timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric'}) : null);
  return {slug:article.slug, title:article.title, dek:article.dek || '', section:article.section || '',
    href:`${root}/articles/${article.slug}`, topic:topicForArticle(article), by:writer.name,
    image:article.image || article.shareImage || existingCardImages[article.slug]?.src || null, imageAlt:article.imageAlt || existingCardImages[article.slug]?.alt || '',
    imageObjectPosition:article.imageObjectPosition || null, date, isoDate,
    timestamp:Number.isFinite(timestamp) ? timestamp : 0, week:article.week || null};
}
const searchable = value => String(value || '').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function filterCrateArticles(articles, {query='',topic='',author='',order='newest'}={}) {
  const needle=searchable(query).trim();
  return articles.filter(a=>(!topic || a.topic===topic) && (!author || a.by===author) && (!needle || searchable(`${a.title} ${a.dek} ${a.by} ${a.section}`).includes(needle)))
    .sort((a,b)=>(order==='oldest' ? a.timestamp-b.timestamp : b.timestamp-a.timestamp) || a.slug.localeCompare(b.slug));
}
