import Link from 'next/link';
import styles from './EditionBureau.module.css';

// Published weekly sections often have no dek. Use their actual opening
// paragraph rather than rendering a grid of otherwise empty title links.
export default function EditionBureau({articles,root,name}) {
  if (!articles.length) return null;
  return <section className={styles.bureau} data-editorial-system="a" aria-label={`${name} bureau`}>
    <h2 className="editorialSectionLabel">FROM THE {name.toUpperCase()} BUREAU</h2>
    <div className={styles.stories}>{articles.map(article => {
      const excerpt=article.dek || (Array.isArray(article.body) ? article.body.find(p=>typeof p==='string' && p.trim()) : null);
      return <article key={article.id}>
        <h3 className="editorialCardTitle"><Link href={`${root}/articles/${article.slug}`}>{article.title}</Link></h3>
        {article.published_at && <time dateTime={article.published_at}>{new Date(article.published_at).toLocaleDateString('en-US',{timeZone:'America/New_York',month:'long',day:'numeric',year:'numeric'})}</time>}
        {excerpt && <p className="editorialDeck">{excerpt}</p>}
      </article>;
    })}</div>
  </section>;
}
