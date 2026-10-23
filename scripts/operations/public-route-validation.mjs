// Inspect rendered document text, excluding inert Next.js flight data and templates.
export function documentText(html) {
  return html.replace(/<!--[^]*?-->/g, '')
    .replace(/<(script|style|template)\b[^>]*>[^]*?<\/\1\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
}
export function validatePublicPage(status, html, {article = false, expectedTitle} = {}) {
  if (status !== 200) throw Error('HTTP ' + status);
  const text = documentText(html);
  if (/Story not found\.|Sorry, not found|404: This page|This deployment is protected|Authentication Required/i.test(text)) throw Error('Missing-page or protected content');
  if (!text.includes('The Brief')) throw Error('Expected publication marker missing');
  if (article && !/<h1\b[^>]*>[^]*?<\/h1\s*>/i.test(html)) throw Error('Article headline missing');
  if (expectedTitle && !text.includes(expectedTitle)) throw Error('Expected article title missing');
}
