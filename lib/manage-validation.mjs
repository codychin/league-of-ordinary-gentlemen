export const ACCESS_ROLES = new Set(['admin', 'editor']);
export const WRITERS = new Set(['gannon', 'crane', 'sorrell', 'kells', 'march', 'pike']);
export const MEMORY_TYPES = new Set(['league', 'manager', 'team', 'rivalry', 'joke', 'event', 'preference', 'correspondent']);

export function text(value, max, required = false) {
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) throw new Error('Please check the form fields.');
  return value.trim();
}

export function accessInput(input) {
  const email = text(input.email, 254, true).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !ACCESS_ROLES.has(input.role)) throw new Error('Enter a valid email and role.');
  return {email, role: input.role};
}

export function articleInput(input, leagueId) {
  const slug = text(input.slug, 100, true);
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || !WRITERS.has(input.writer_slug) || !['draft', 'review', 'published', 'archived'].includes(input.status)) throw new Error('Check the article slug, writer, and status.');
  const body = text(input.body_text, 50000, true).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
  return {scope: 'league', league_id: leagueId, slug, writer_slug: input.writer_slug, title: text(input.title, 240, true), dek: text(input.dek || '', 800), section: text(input.section || 'The League', 80, true), body, status: input.status, published_at: input.status === 'published' ? new Date().toISOString() : null, updated_at: new Date().toISOString()};
}

export function memoryInput(input, leagueId) {
  if (!MEMORY_TYPES.has(input.subject_type) || !['active', 'retired', 'disputed'].includes(input.status)) throw new Error('Check the memory type and status.');
  return {league_id: leagueId, subject_type: input.subject_type, subject_key: text(input.subject_key || '', 100), memory_key: text(input.memory_key, 120, true), content: text(input.content, 10000, true), status: input.status, updated_at: new Date().toISOString()};
}

export function sameOrigin(request) {
  const origin = request.headers.get('origin');
  return origin === new URL(request.url).origin;
}
